-- NEXORA human review workflow.
create or replace function public.is_nexora_reviewer(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members om
    where om.user_id = p_user_id
      and om.member_role in ('owner','reviewer','coordinator')
  );
$$;

grant execute on function public.is_nexora_reviewer(uuid) to authenticated;

create policy "reviewers can view candidate matches"
on public.matches for select to authenticated
using (public.is_nexora_reviewer((select auth.uid())));

create policy "reviewers can update match review status"
on public.matches for update to authenticated
using (public.is_nexora_reviewer((select auth.uid())))
with check (public.is_nexora_reviewer((select auth.uid())));

create or replace function public.propose_matches_for_need(p_need_id uuid, p_limit integer default 5)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if not public.is_nexora_reviewer(auth.uid()) then
    raise exception 'reviewer access required';
  end if;

  insert into public.matches (need_id, resource_id, requester_id, provider_id, status, human_review_required)
  select n.id, r.id, n.requester_id, r.provider_id, 'proposed', true
  from public.needs n
  join lateral (
    select rr.*
    from public.resources rr
    where rr.status = 'verified'
      and rr.category = n.category
      and rr.city = n.city
      and rr.quantity >= n.people_count
      and (rr.available_until is null or rr.available_until > now())
    order by rr.created_at desc
    limit greatest(1, least(p_limit, 20))
  ) r on true
  where n.id = p_need_id
  on conflict (need_id, resource_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.propose_matches_for_need(uuid, integer) to authenticated;

create or replace function public.review_match(p_match_id uuid, p_decision public.match_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_nexora_reviewer(auth.uid()) then
    raise exception 'reviewer access required';
  end if;

  if p_decision not in ('accepted','rejected','cancelled') then
    raise exception 'invalid review decision';
  end if;

  update public.matches
     set status = p_decision,
         human_review_required = false,
         updated_at = now()
   where id = p_match_id;
end;
$$;

grant execute on function public.review_match(uuid, public.match_status) to authenticated;
