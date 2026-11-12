-- Organization onboarding and administrator-controlled verification.
-- Organization owners are created atomically; clients cannot self-verify organizations.

alter table public.organizations
  add column if not exists registration_reference text,
  add column if not exists contact_email text,
  add column if not exists website text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id);

create table if not exists public.organization_review_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('verified','rejected','changes_requested')),
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists organization_review_events_org_idx
  on public.organization_review_events(organization_id, created_at desc);
alter table public.organization_review_events enable row level security;
revoke all on public.organization_review_events from anon, authenticated;
grant select on public.organization_review_events to authenticated;
create policy "admins can read organization review audit" on public.organization_review_events
  for select to authenticated using (
    exists (select 1 from public.reviewer_access ra
      where ra.user_id = (select auth.uid()) and ra.access_role = 'admin' and ra.is_active)
  );

drop policy if exists "creator submits organization" on public.organizations;
revoke insert on public.organizations from authenticated;

create policy "organization members can view their organization"
  on public.organizations for select to authenticated using (
    exists (select 1 from public.organization_members om
      where om.organization_id = organizations.id and om.user_id = (select auth.uid()))
  );
create policy "active reviewers can view pending organizations"
  on public.organizations for select to authenticated using (
    verification_status = 'pending' and exists (
      select 1 from public.reviewer_access ra
      where ra.user_id = (select auth.uid()) and ra.is_active
    )
  );

create or replace function public.submit_provider_organization(
  p_name text,
  p_organization_type text,
  p_city text,
  p_registration_reference text,
  p_contact_email text,
  p_website text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_org_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(trim(p_name)) not between 2 and 160 then
    raise exception 'Organization name must be between 2 and 160 characters';
  end if;
  if p_organization_type is null or char_length(trim(p_organization_type)) not between 2 and 80 then
    raise exception 'Organization type is required';
  end if;
  if p_city is null or char_length(trim(p_city)) not between 2 and 100 then
    raise exception 'A valid service area is required';
  end if;
  if p_registration_reference is null or char_length(trim(p_registration_reference)) not between 3 and 120 then
    raise exception 'Provide an organization registration or authorization reference';
  end if;
  if p_contact_email is not null and char_length(trim(p_contact_email)) > 254 then
    raise exception 'Contact email is too long';
  end if;
  if p_website is not null and (char_length(trim(p_website)) > 300 or trim(p_website) !~* '^https?://') then
    raise exception 'Website must be a valid http(s) URL';
  end if;

  insert into public.organizations(
    name, organization_type, city, verification_status, created_by,
    registration_reference, contact_email, website
  ) values (
    trim(p_name), trim(p_organization_type), trim(p_city), 'pending', v_user,
    trim(p_registration_reference), nullif(trim(coalesce(p_contact_email,'')), ''),
    nullif(trim(coalesce(p_website,'')), '')
  ) returning id into v_org_id;

  insert into public.organization_members(organization_id, user_id, member_role)
  values (v_org_id, v_user, 'owner');
  return v_org_id;
end;
$$;
revoke all on function public.submit_provider_organization(text,text,text,text,text,text) from public, anon;
grant execute on function public.submit_provider_organization(text,text,text,text,text,text) to authenticated;

create or replace function public.my_provider_organizations()
returns table (
  id uuid, name text, organization_type text, city text,
  verification_status text, member_role text, created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.id, o.name, o.organization_type, o.city,
         o.verification_status, om.member_role, o.created_at
  from public.organizations o
  join public.organization_members om on om.organization_id = o.id
  where om.user_id = auth.uid()
  order by o.created_at desc;
$$;
revoke all on function public.my_provider_organizations() from public, anon;
grant execute on function public.my_provider_organizations() to authenticated;

create or replace function public.review_provider_organization(
  p_organization_id uuid,
  p_decision text,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.reviewer_access
    where user_id = v_user and access_role = 'admin' and is_active) then
    raise exception 'Administrator access required';
  end if;
  if p_decision is null or p_decision not in ('verified','rejected','changes_requested') then
    raise exception 'Invalid organization review decision';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 or char_length(p_reason) > 1000 then
    raise exception 'A review reason between 3 and 1000 characters is required';
  end if;

  select verification_status into v_status from public.organizations
    where id = p_organization_id for update;
  if not found then raise exception 'Organization not found'; end if;
  if v_status <> 'pending' then raise exception 'Only pending organizations can be reviewed'; end if;

  update public.organizations
    set verification_status = case p_decision
      when 'verified' then 'verified' else 'rejected' end,
      reviewed_at = now(), reviewed_by = v_user
    where id = p_organization_id;

  insert into public.organization_review_events(organization_id, reviewer_id, decision, reason)
    values (p_organization_id, v_user, p_decision, trim(p_reason));
end;
$$;
revoke all on function public.review_provider_organization(uuid,text,text) from public, anon;
grant execute on function public.review_provider_organization(uuid,text,text) to authenticated;

-- Resource-to-organization links require an active membership with a management role.
drop policy if exists "provider submits resource for review" on public.resources;
create policy "provider submits resource for review" on public.resources
  for insert to authenticated with check (
    provider_id = (select auth.uid()) and status = 'pending_review' and verified_at is null
    and (organization_id is null or exists (
      select 1 from public.organization_members om
      where om.organization_id = resources.organization_id
        and om.user_id = (select auth.uid())
        and om.member_role in ('owner','coordinator')
    ))
  );

drop policy if exists "provider updates own unverified resources" on public.resources;
create policy "provider updates own unverified resources" on public.resources
  for update to authenticated using (
    provider_id = (select auth.uid()) and status in ('draft','pending_review')
  ) with check (
    provider_id = (select auth.uid()) and status in ('draft','pending_review')
    and verified_at is null
    and (organization_id is null or exists (
      select 1 from public.organization_members om
      where om.organization_id = resources.organization_id
        and om.user_id = (select auth.uid())
        and om.member_role in ('owner','coordinator')
    ))
  );

comment on column public.organizations.registration_reference is
  'Private verification reference; never expose in public organization listings.';
comment on function public.review_provider_organization(uuid,text,text) is
  'Only active administrators can verify/reject pending organizations; all decisions are audited.';
