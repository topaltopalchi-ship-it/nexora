-- Deterministic, read-only suggestions. No match rows are created and no allocation is automatic.
-- SECURITY INVOKER keeps both needs and resources subject to their existing RLS policies.
create or replace function public.suggest_resources_for_need(p_need_id uuid)
returns table (
  resource_id uuid,
  title text,
  public_summary text,
  city text,
  quantity integer,
  enough_quantity boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.id,
    r.title,
    r.public_summary,
    r.city,
    r.quantity,
    (r.quantity >= n.people_count) as enough_quantity
  from public.needs n
  join public.resources r
    on r.category = n.category
   and lower(btrim(r.city)) = lower(btrim(n.city))
  where n.id = p_need_id
    and n.requester_id = (select auth.uid())
    and n.status in ('open', 'reviewing')
    and r.status = 'verified'
    and (r.available_until is null or r.available_until > now())
    and r.provider_id <> n.requester_id
  order by
    (r.quantity >= n.people_count) desc,
    r.available_until asc nulls last,
    r.created_at desc
  limit 10;
$$;
revoke all on function public.suggest_resources_for_need(uuid) from public, anon;
grant execute on function public.suggest_resources_for_need(uuid) to authenticated;
comment on function public.suggest_resources_for_need(uuid) is
  'Returns up to 10 verified, same-category, same-city resource suggestions for a need owned by the caller. Read-only; does not create matches or allocate resources.';
