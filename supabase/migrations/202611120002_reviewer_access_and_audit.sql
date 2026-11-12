-- Restricted reviewer access and audited resource-offer decisions.
-- Reviewer accounts must be provisioned by a trusted project administrator.
create table if not exists public.reviewer_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_role text not null check (access_role in ('reviewer','admin')),
  is_active boolean not null default true,
  granted_at timestamptz not null default now()
);

alter table public.reviewer_access enable row level security;
revoke all on public.reviewer_access from anon, authenticated;
grant select on public.reviewer_access to authenticated;
create policy "reviewers can view their own access" on public.reviewer_access
  for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.resource_review_events (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved','rejected','changes_requested')),
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists resource_review_events_resource_idx
  on public.resource_review_events(resource_id, created_at desc);

alter table public.resource_review_events enable row level security;
revoke all on public.resource_review_events from anon, authenticated;
grant select on public.resource_review_events to authenticated;
create policy "active reviewers can read review audit" on public.resource_review_events
  for select to authenticated using (
    exists (
      select 1 from public.reviewer_access ra
      where ra.user_id = (select auth.uid()) and ra.is_active = true
    )
  );

create policy "active reviewers can read submitted resources" on public.resources
  for select to authenticated using (
    exists (
      select 1 from public.reviewer_access ra
      where ra.user_id = (select auth.uid()) and ra.is_active = true
    )
  );

create or replace function public.review_resource_offer(
  p_resource_id uuid,
  p_decision text,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_status public.resource_status;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.reviewer_access
    where user_id = v_user and is_active = true
  ) then
    raise exception 'Reviewer access required';
  end if;

  if p_decision is null or p_decision not in ('approved','rejected','changes_requested') then
    raise exception 'Invalid review decision';
  end if;

  if p_reason is null or char_length(trim(p_reason)) < 3 or char_length(p_reason) > 1000 then
    raise exception 'A review reason between 3 and 1000 characters is required';
  end if;

  select status into v_status
  from public.resources
  where id = p_resource_id
  for update;

  if not found then
    raise exception 'Resource offer not found';
  end if;
  if v_status <> 'pending_review' then
    raise exception 'Only pending offers can be reviewed';
  end if;

  update public.resources
  set status = case p_decision
      when 'approved' then 'verified'::public.resource_status
      when 'rejected' then 'suspended'::public.resource_status
      else 'draft'::public.resource_status
    end,
    verified_at = case when p_decision = 'approved' then now() else null end,
    updated_at = now()
  where id = p_resource_id;

  insert into public.resource_review_events(resource_id, reviewer_id, decision, reason)
  values (p_resource_id, v_user, p_decision, trim(p_reason));
end;
$$;

revoke all on function public.review_resource_offer(uuid,text,text) from public, anon;
grant execute on function public.review_resource_offer(uuid,text,text) to authenticated;

comment on table public.reviewer_access is
  'Provision reviewer access only through a trusted Supabase administrator; never expose client-side role assignment.';
comment on function public.review_resource_offer(uuid,text,text) is
  'Audited human review for pending offers. Only active reviewers can approve, reject, or request changes.';
