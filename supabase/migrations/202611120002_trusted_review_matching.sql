-- Trusted review and deterministic match proposal workflow.
-- Client users still cannot insert/update matches directly.

create or replace function public.is_reviewer_for_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org
      and om.user_id = (select auth.uid())
      and om.member_role in ('owner','reviewer','coordinator')
  );
$$;

create or replace function public.review_resource(p_resource uuid, p_decision text)
returns public.resources
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.resources;
begin
  if p_decision not in ('verify','reject') then
    raise exception 'invalid review decision';
  end if;

  select * into r from public.resources where id = p_resource for update;

  if r.id is null then
    raise exception 'resource not found';
  end if;

  if r.organization_id is null or not public.is_reviewer_for_org(r.organization_id) then
    raise exception 'reviewer authorization required';
  end if;

  update public.resources
  set status = case when p_decision = 'verify' then 'verified'::public.resource_status else 'suspended'::public.resource_status end,
      verified_at = case when p_decision = 'verify' then now() else null end,
      updated_at = now()
  where id = p_resource
  returning * into r;

  return r;
end;
$$;

grant execute on function public.review_resource(uuid, text) to authenticated;

create or replace function public.propose_matches_for_need(p_need uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n public.needs;
  inserted_count integer := 0;
begin
  select * into n from public.needs where id = p_need;

  if n.id is null then raise exception 'need not found'; end if;

  if not exists (
    select 1 from public.organization_members om
    where om.user_id = (select auth.uid())
      and om.member_role in ('owner','reviewer','coordinator')
  ) then
    raise exception 'reviewer authorization required';
  end if;

  insert into public.matches (need_id, resource_id, requester_id, provider_id, status, human_review_required)
  select n.id, r.id, n.requester_id, r.provider_id, 'proposed'::public.match_status, true
  from public.resources r
  where r.status = 'verified'
    and r.category = n.category
    and r.city = n.city
    and (r.available_until is null or r.available_until > now())
    and not exists (
      select 1 from public.matches m where m.need_id = n.id and m.resource_id = r.id
    )
  order by r.created_at desc
  limit 10
  on conflict (need_id, resource_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

grant execute on function public.propose_matches_for_need(uuid) to authenticated;

create policy "reviewers can read organization pending resources"
on public.resources for select to authenticated
using (
  status in ('pending_review','draft')
  and organization_id is not null
  and public.is_reviewer_for_org(organization_id)
);

create policy "reviewers can read open needs"
on public.needs for select to authenticated
using (
  status in ('open','reviewing')
  and exists (
    select 1 from public.organization_members om
    where om.user_id = (select auth.uid())
      and om.member_role in ('owner','reviewer','coordinator')
  )
);

create policy "reviewers can read proposed matches"
on public.matches for select to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.user_id = (select auth.uid())
      and om.member_role in ('owner','reviewer','coordinator')
  )
);
