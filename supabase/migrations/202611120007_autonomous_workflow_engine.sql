-- Autonomous workflow foundation: durable jobs, event triggers, deterministic matching.
create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('match_need','refresh_resource_matches')),
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists automation_jobs_ready_idx
  on public.automation_jobs(status, available_at, created_at);
alter table public.automation_jobs enable row level security;
revoke all on public.automation_jobs from anon, authenticated;
grant select, insert, update, delete on public.automation_jobs to service_role;

create or replace function public.enqueue_automation_job(
  p_job_type text, p_payload jsonb, p_dedupe_key text
) returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if p_job_type not in ('match_need','refresh_resource_matches') then
    raise exception 'Unsupported automation job';
  end if;
  insert into public.automation_jobs(job_type,payload,dedupe_key)
  values (p_job_type,coalesce(p_payload,'{}'::jsonb),p_dedupe_key)
  on conflict (dedupe_key) do update
    set status = case when automation_jobs.status in ('completed','failed') then 'pending' else automation_jobs.status end,
        available_at = case when automation_jobs.status in ('completed','failed') then now() else automation_jobs.available_at end,
        attempts = case when automation_jobs.status in ('completed','failed') then 0 else automation_jobs.attempts end,
        last_error = case when automation_jobs.status in ('completed','failed') then null else automation_jobs.last_error end
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.enqueue_automation_job(text,jsonb,text) from public, anon, authenticated;

create or replace function public.enqueue_need_matching()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  perform public.enqueue_automation_job('match_need',
    jsonb_build_object('need_id',new.id), 'need:'||new.id::text);
  return new;
end;
$$;
create trigger needs_enqueue_matching after insert on public.needs
for each row execute function public.enqueue_need_matching();

create or replace function public.enqueue_resource_matching()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status is distinct from new.status
      or old.quantity is distinct from new.quantity
      or old.available_until is distinct from new.available_until) then
    perform public.enqueue_automation_job('refresh_resource_matches',
      jsonb_build_object('resource_id',new.id),
      'resource:'||new.id::text||':'||new.updated_at::text);
  end if;
  return new;
end;
$$;
create trigger resources_enqueue_matching after insert or update on public.resources
for each row execute function public.enqueue_resource_matching();

create or replace function public.process_need_matching(p_need_id uuid)
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_need public.needs%rowtype; v_count integer;
begin
  select * into v_need from public.needs where id=p_need_id;
  if not found or v_need.status not in ('open','reviewing') then return 0; end if;
  insert into public.matches(need_id,resource_id,requester_id,provider_id,status,human_review_required)
  select v_need.id,r.id,v_need.requester_id,r.provider_id,'proposed',
    (v_need.category in ('healthcare','housing'))
  from public.resources r
  where r.status='verified'
    and r.category=v_need.category
    and lower(r.city)=lower(v_need.city)
    and (r.available_until is null or r.available_until > now())
    and r.quantity > 0
  on conflict (need_id,resource_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.process_need_matching(uuid) from public, anon, authenticated;
grant execute on function public.process_need_matching(uuid) to service_role;

create or replace function public.run_automation_job(p_job_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_job public.automation_jobs%rowtype; v_need record;
begin
  select * into v_job from public.automation_jobs
    where id=p_job_id and status='processing' for update;
  if not found then raise exception 'Job is not claimed'; end if;
  if v_job.job_type='match_need' then
    perform public.process_need_matching((v_job.payload->>'need_id')::uuid);
  elsif v_job.job_type='refresh_resource_matches' then
    for v_need in select n.id from public.needs n
      join public.resources r on r.category=n.category and lower(r.city)=lower(n.city)
      where r.id=(v_job.payload->>'resource_id')::uuid and n.status in ('open','reviewing')
    loop
      perform public.process_need_matching(v_need.id);
    end loop;
  else
    raise exception 'Unknown automation job type';
  end if;
end;
$$;
revoke all on function public.run_automation_job(uuid) from public, anon, authenticated;
grant execute on function public.run_automation_job(uuid) to service_role;

create or replace function public.claim_automation_jobs(p_limit integer default 10)
returns table(id uuid, job_type text, payload jsonb, attempts integer)
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if p_limit < 1 or p_limit > 50 then raise exception 'Invalid batch size'; end if;
  return query
  with picked as (
    select j.id from public.automation_jobs j
    where ((j.status='pending' and j.available_at <= now())
       or (j.status='processing' and j.locked_at < now()-interval '5 minutes'))
      and j.attempts < j.max_attempts
    order by j.available_at,j.created_at
    for update skip locked limit p_limit
  )
  update public.automation_jobs j
    set status='processing', locked_at=now(), attempts=j.attempts+1
  from picked where j.id=picked.id
  returning j.id,j.job_type,j.payload,j.attempts;
end;
$$;
revoke all on function public.claim_automation_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_automation_jobs(integer) to service_role;

create or replace function public.finish_automation_job(p_job_id uuid)
returns void language sql security definer
set search_path = public, pg_temp
as $$
  update public.automation_jobs set status='completed',completed_at=now(),locked_at=null,last_error=null
  where id=p_job_id and status='processing';
$$;
revoke all on function public.finish_automation_job(uuid) from public, anon, authenticated;
grant execute on function public.finish_automation_job(uuid) to service_role;

create or replace function public.fail_automation_job(p_job_id uuid,p_error text)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  update public.automation_jobs
  set status=case when attempts >= max_attempts then 'failed' else 'pending' end,
      available_at=now()+make_interval(secs => least(3600, power(2,least(attempts,10))::integer*15)),
      locked_at=null,last_error=left(coalesce(p_error,'Unknown worker error'),1000)
  where id=p_job_id and status='processing';
end;
$$;
revoke all on function public.fail_automation_job(uuid,text) from public, anon, authenticated;
grant execute on function public.fail_automation_job(uuid,text) to service_role;

comment on table public.automation_jobs is
  'Private durable queue for autonomous, retryable workflows. Only the service-role worker can claim or execute jobs.';
