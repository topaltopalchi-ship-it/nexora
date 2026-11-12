-- NEXORA matching primitives.
-- Trusted/server workflows can use this function to discover eligible verified resources.
create or replace function public.find_resource_matches(p_need_id uuid, p_limit integer default 10)
returns table (
  resource_id uuid,
  score integer,
  same_city boolean,
  same_category boolean,
  available_quantity integer
)
language sql
security invoker
set search_path = public
as $$
  select
    r.id,
    (
      case when r.city = n.city then 60 else 0 end +
      case when r.category = n.category then 30 else 0 end +
      case when r.quantity >= n.people_count then 10 else 0 end
    )::integer as score,
    (r.city = n.city) as same_city,
    (r.category = n.category) as same_category,
    r.quantity
  from public.needs n
  join public.resources r
    on r.status = 'verified'
   and (r.available_until is null or r.available_until > now())
   and r.quantity > 0
  where n.id = p_need_id
    and r.category = n.category
  order by score desc, r.created_at desc
  limit greatest(1, least(p_limit, 50));
$$;

grant execute on function public.find_resource_matches(uuid, integer) to authenticated;
