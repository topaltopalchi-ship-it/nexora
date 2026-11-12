-- Keep need state consistent with human match decisions.
create or replace function public.review_match(p_match_id uuid, p_decision public.match_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_need_id uuid;
begin
  if not public.is_nexora_reviewer(auth.uid()) then
    raise exception 'reviewer access required';
  end if;

  if p_decision not in ('accepted','rejected','cancelled') then
    raise exception 'invalid review decision';
  end if;

  select need_id into v_need_id from public.matches where id = p_match_id for update;
  if v_need_id is null then raise exception 'match not found'; end if;

  update public.matches
     set status = p_decision,
         human_review_required = false,
         updated_at = now()
   where id = p_match_id;

  if p_decision = 'accepted' then
    update public.needs set status='matched', updated_at=now()
    where id=v_need_id and status in ('open','reviewing');
  elsif p_decision in ('rejected','cancelled') then
    update public.needs set status='open', updated_at=now()
    where id=v_need_id and status='matched';
  end if;
end;
$$;

grant execute on function public.review_match(uuid, public.match_status) to authenticated;
