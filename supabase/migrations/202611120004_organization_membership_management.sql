-- Organization member invitations and owner-controlled membership lifecycle.
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email_normalized text not null,
  member_role text not null check (member_role in ('coordinator','reviewer')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists organization_invitations_org_idx
  on public.organization_invitations(organization_id, created_at desc);
alter table public.organization_invitations enable row level security;
revoke all on public.organization_invitations from anon, authenticated;

create or replace function public.my_organization_members(p_organization_id uuid)
returns table (
  user_id uuid, member_role text, display_name text, email text, joined_at timestamptz
)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = auth.uid()
  ) then raise exception 'Organization membership required'; end if;

  return query
    select om.user_id, om.member_role, p.display_name,\n           case when exists (select 1 from public.organization_members self\n             where self.organization_id = p_organization_id and self.user_id = auth.uid()\n               and self.member_role in ('owner','coordinator')) then u.email else null end,\n           om.created_at
    from public.organization_members om
    join auth.users u on u.id = om.user_id
    left join public.profiles p on p.id = om.user_id
    where om.organization_id = p_organization_id
    order by case om.member_role when 'owner' then 0 when 'coordinator' then 1 else 2 end, om.created_at;
end;
$$;
revoke all on function public.my_organization_members(uuid) from public, anon;
grant execute on function public.my_organization_members(uuid) to authenticated;

create or replace function public.invite_organization_member(
  p_organization_id uuid, p_email text, p_member_role text
) returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_token text := encode(gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = auth.uid() and member_role = 'owner') then
    raise exception 'Only an organization owner can invite members';
  end if;
  if not exists (select 1 from public.organizations
    where id = p_organization_id and verification_status = 'verified') then
    raise exception 'Only verified organizations can invite members';
  end if;
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;
  if p_member_role is null or p_member_role not in ('coordinator','reviewer') then
    raise exception 'Invitations may grant coordinator or reviewer roles only';
  end if;
  if exists (select 1 from public.organization_members om
    join auth.users u on u.id = om.user_id
    where om.organization_id = p_organization_id and lower(u.email) = v_email) then
    raise exception 'This person is already a member';
  end if;
  update public.organization_invitations set revoked_at = now()
    where organization_id = p_organization_id and email_normalized = v_email
      and accepted_at is null and revoked_at is null;
  insert into public.organization_invitations(
    organization_id,email_normalized,member_role,token_hash,invited_by
  ) values (
    p_organization_id,v_email,p_member_role,encode(digest(v_token,'sha256'),'hex'),auth.uid()
  );
  return v_token;
end;
$$;
revoke all on function public.invite_organization_member(uuid,text,text) from public, anon;
grant execute on function public.invite_organization_member(uuid,text,text) to authenticated;

create or replace function public.accept_organization_invitation(p_token text)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_invitation public.organization_invitations%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select lower(email) into v_email from auth.users where id = v_user;
  if v_email is null or not exists (select 1 from auth.users where id = v_user and email_confirmed_at is not null) then raise exception 'A verified account email is required'; end if;
  select * into v_invitation from public.organization_invitations
    where token_hash = encode(digest(coalesce(p_token,''),'sha256'),'hex')
      and accepted_at is null and revoked_at is null and expires_at > now()
    for update;
  if not found then raise exception 'Invitation is invalid, expired, or already used'; end if;
  if v_email <> v_invitation.email_normalized then
    raise exception 'Sign in with the email address that received this invitation';
  end if;
  insert into public.organization_members(organization_id,user_id,member_role)
    values (v_invitation.organization_id,v_user,v_invitation.member_role)
    on conflict (organization_id,user_id) do nothing;
  update public.organization_invitations set accepted_at = now() where id = v_invitation.id;
  return v_invitation.organization_id;
end;
$$;
revoke all on function public.accept_organization_invitation(text) from public, anon;
grant execute on function public.accept_organization_invitation(text) to authenticated;

create or replace function public.revoke_organization_member(
  p_organization_id uuid, p_member_user_id uuid
) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_owner_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = auth.uid() and member_role = 'owner') then
    raise exception 'Only an organization owner can remove members';
  end if;
  select member_role into v_role from public.organization_members
    where organization_id = p_organization_id and user_id = p_member_user_id for update;
  if not found then raise exception 'Organization member not found'; end if;
  if v_role = 'owner' then
    select count(*) into v_owner_count from public.organization_members
      where organization_id = p_organization_id and member_role = 'owner';
    if v_owner_count <= 1 then raise exception 'The last organization owner cannot be removed'; end if;
    if p_member_user_id = auth.uid() then raise exception 'Transfer ownership before leaving the organization'; end if;
  end if;
  delete from public.organization_members
    where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;
revoke all on function public.revoke_organization_member(uuid,uuid) from public, anon;
grant execute on function public.revoke_organization_member(uuid,uuid) to authenticated;

create or replace function public.my_organization_invitations(p_organization_id uuid)
returns table (id uuid,email text,member_role text,expires_at timestamptz,created_at timestamptz)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = auth.uid() and member_role = 'owner') then
    raise exception 'Only an organization owner can view pending invitations';
  end if;
  return query select oi.id,oi.email_normalized,oi.member_role,oi.expires_at,oi.created_at
    from public.organization_invitations oi
    where oi.organization_id = p_organization_id and oi.accepted_at is null
      and oi.revoked_at is null and oi.expires_at > now()
    order by oi.created_at desc;
end;
$$;
revoke all on function public.my_organization_invitations(uuid) from public, anon;
grant execute on function public.my_organization_invitations(uuid) to authenticated;

create or replace function public.cancel_organization_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.organization_invitations oi set revoked_at = now()
    where oi.id = p_invitation_id and oi.accepted_at is null and oi.revoked_at is null
      and exists (select 1 from public.organization_members om
        where om.organization_id = oi.organization_id and om.user_id = auth.uid() and om.member_role = 'owner');
  if not found then raise exception 'Invitation not found or owner permission required'; end if;
end;
$$;
revoke all on function public.cancel_organization_invitation(uuid) from public, anon;
grant execute on function public.cancel_organization_invitation(uuid) to authenticated;

-- Members can see offers linked to their organization; mutation remains limited to the submitting provider and owner/coordinator membership.
create policy "organization members can view linked offers"
  on public.resources for select to authenticated using (
    organization_id is not null and exists (
      select 1 from public.organization_members om
      where om.organization_id = resources.organization_id and om.user_id = (select auth.uid())
    )
  );
