create or replace function public.review_match(
  p_match uuid,
  p_decision text
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_resource public.resources;
  v_need public.needs;
begin
  if p_decision not in ('accept', 'reject') then
    raise exception 'Invalid match decision';
  end if;

  select * into v_match
  from public.matches
  where id = p_match
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  select * into v_resource
  from public.resources
  where id = v_match.resource_id
  for update;

  select * into v_need
  from public.needs
  where id = v_match.need_id
  for update;

  if not public.is_reviewer_for_org(v_resource.organization_id) then
    raise exception 'Reviewer authorization required';
  end if;

  if v_match.status <> 'proposed' or not v_match.human_review_required then
    raise exception 'Match is not awaiting human review';
  end if;

  if p_decision = 'accept' then
    if v_resource.status <> 'verified' then
      raise exception 'Resource is no longer available for acceptance';
    end if;

    if v_resource.available_until is not null and v_resource.available_until <= now() then
      raise exception 'Resource has expired';
    end if;

    if v_need.status not in ('open', 'reviewing') then
      raise exception 'Need is no longer open for matching';
    end if;

    update public.matches
    set status = 'accepted',
        human_review_required = false,
        updated_at = now()
    where id = p_match
    returning * into v_match;

    update public.resources
    set status = 'reserved',
        updated_at = now()
    where id = v_resource.id;

    update public.needs
    set status = 'matched',
        updated_at = now()
    where id = v_need.id;
  else
    update public.matches
    set status = 'rejected',
        human_review_required = false,
        updated_at = now()
    where id = p_match
    returning * into v_match;

    if not exists (
      select 1
      from public.matches m
      where m.need_id = v_need.id
        and m.status in ('proposed', 'accepted')
    ) then
      update public.needs
      set status = 'reviewing',
          updated_at = now()
      where id = v_need.id
        and status in ('open', 'reviewing');
    end if;
  end if;

  return v_match;
end;
$$;

grant execute on function public.review_match(uuid, text) to authenticated;
