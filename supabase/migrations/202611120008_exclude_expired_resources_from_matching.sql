-- NEXORA: prevent expired assistance offers from entering new match proposals.
-- Existing proposals are retained for audit; this affects future matching only.

create index if not exists resources_match_expiry_idx
  on public.resources(status, category, city, expiry_date, available_until);

create or replace function public.process_need_matching(p_need_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_need public.needs%rowtype;
  v_count integer;
begin
  select * into v_need
  from public.needs
  where id = p_need_id;

  if not found or v_need.status not in ('open','reviewing') then
    return 0;
  end if;

  insert into public.matches(
    need_id, resource_id, requester_id, provider_id, status, human_review_required
  )
  select
    v_need.id,
    r.id,
    v_need.requester_id,
    r.provider_id,
    'proposed',
    (v_need.category in ('healthcare','housing'))
  from public.resources r
  where r.status = 'verified'
    and r.category = v_need.category
    and lower(trim(r.city)) = lower(trim(v_need.city))
    and (r.available_until is null or r.available_until > now())
    and (r.expiry_date is null or r.expiry_date >= current_date)
    and r.quantity > 0
  on conflict (need_id, resource_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.process_need_matching(uuid) from public, anon, authenticated;
grant execute on function public.process_need_matching(uuid) to service_role;

comment on function public.process_need_matching(uuid) is
  'Creates proposals only from verified, active, non-expired resources in the same category and city. It does not reserve capacity or confirm assistance.';
