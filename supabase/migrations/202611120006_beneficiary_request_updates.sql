-- Beneficiary-visible request status updates and private reviewer messaging.
create table if not exists public.need_updates (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.needs(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  actor_role text not null check (actor_role in ('beneficiary','reviewer')),
  update_type text not null check (update_type in ('status','information_requested','response')),
  message text not null check (char_length(trim(message)) between 3 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists need_updates_need_idx on public.need_updates(need_id, created_at);
alter table public.need_updates enable row level security;
revoke all on public.need_updates from anon, authenticated;
grant select on public.need_updates to authenticated;

create policy "requesters and active reviewers read private need updates"
on public.need_updates for select to authenticated using (
  exists (select 1 from public.needs n where n.id = need_updates.need_id and n.requester_id = (select auth.uid()))
  or exists (select 1 from public.reviewer_access ra where ra.user_id = (select auth.uid()) and ra.is_active = true)
);

create policy "active reviewers read submitted needs"
on public.needs for select to authenticated using (
  exists (select 1 from public.reviewer_access ra where ra.user_id = (select auth.uid()) and ra.is_active = true)
);

create or replace function public.review_beneficiary_request(
  p_need_id uuid, p_decision text, p_message text
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_status public.need_status;
  v_next public.need_status;
  v_type text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.reviewer_access where user_id = v_user and is_active = true) then
    raise exception 'Active reviewer access required';
  end if;
  if p_decision not in ('reviewing','information_requested','closed') then
    raise exception 'Invalid request review decision';
  end if;
  if p_message is null or char_length(trim(p_message)) < 3 or char_length(p_message) > 1000 then
    raise exception 'A beneficiary-facing message between 3 and 1000 characters is required';
  end if;
  select status into v_status from public.needs where id = p_need_id for update;
  if not found then raise exception 'Request not found'; end if;
  if v_status in ('resolved','closed','matched','in_progress') then
    raise exception 'This request is no longer in the review queue';
  end if;
  v_next := p_decision::public.need_status;
  v_type := case when p_decision = 'information_requested' then 'information_requested' else 'status' end;
  update public.needs set status = v_next, updated_at = now() where id = p_need_id;
  insert into public.need_updates(need_id,actor_id,actor_role,update_type,message)
  values (p_need_id,v_user,'reviewer',v_type,trim(p_message));
end;
$$;
revoke all on function public.review_beneficiary_request(uuid,text,text) from public, anon;
grant execute on function public.review_beneficiary_request(uuid,text,text) to authenticated;

create or replace function public.respond_to_need_information(
  p_need_id uuid, p_message text
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_status public.need_status;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_message is null or char_length(trim(p_message)) < 3 or char_length(p_message) > 1000 then
    raise exception 'Your response must be between 3 and 1000 characters';
  end if;
  select status into v_status from public.needs where id = p_need_id and requester_id = v_user for update;
  if not found then raise exception 'Request not found'; end if;
  if v_status <> 'information_requested' then
    raise exception 'A response can only be sent when the reviewer has requested information';
  end if;
  insert into public.need_updates(need_id,actor_id,actor_role,update_type,message)
  values (p_need_id,v_user,'beneficiary','response',trim(p_message));
  update public.needs set status = 'reviewing', updated_at = now() where id = p_need_id;
end;
$$;
revoke all on function public.respond_to_need_information(uuid,text) from public, anon;
grant execute on function public.respond_to_need_information(uuid,text) to authenticated;

comment on table public.need_updates is
  'Private, auditable beneficiary-facing messages and status updates. Not exposed in public directories.';
