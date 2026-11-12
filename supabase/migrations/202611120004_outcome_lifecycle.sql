revoke insert on public.outcome_events from authenticated;

create or replace function public.record_outcome_event(
  p_match uuid,
  p_event_type text,
  p_note text default null
)
returns public.outcome_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_resource public.resources;
  v_need public.needs;
  v_last_event text;
  v_event public.outcome_events;
begin
  if p_event_type not in ('reserved', 'collected', 'delivered', 'received', 'cancelled', 'follow_up') then
    raise exception 'Invalid outcome event type';
  end if;

  if p_note is not null and length(p_note) > 2000 then
    raise exception 'Outcome note is too long';
  end if;

  select * into v_match
  from public.matches
  where id = p_match
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if auth.uid() is null
     or auth.uid() not in (v_match.requester_id, v_match.provider_id) then
    raise exception 'Only match participants can record outcomes';
  end if;

  if v_match.status <> 'accepted' then
    raise exception 'Only accepted matches can receive lifecycle events';
  end if;

  select status into v_last_event
  from public.outcome_events
  where match_id = p_match
  order by created_at desc
  limit 1;

  if p_event_type = 'reserved' and v_last_event is not null then
    raise exception 'Match has already started its lifecycle';
  end if;

  if p_event_type = 'collected' and v_last_event <> 'reserved' then
    raise exception 'Collected must follow reserved';
  end if;

  if p_event_type = 'delivered' and v_last_event <> 'collected' then
    raise exception 'Delivered must follow collected';
  end if;

  if p_event_type = 'received' and v_last_event <> 'delivered' then
    raise exception 'Received must follow delivered';
  end if;

  if p_event_type = 'cancelled' and v_last_event = 'received' then
    raise exception 'Completed matches cannot be cancelled';
  end if;

  if p_event_type = 'follow_up' and v_last_event is null then
    raise exception 'Follow-up requires a started lifecycle';
  end if;

  insert into public.outcome_events(match_id, actor_id, event_type, note)
  values (p_match, auth.uid(), p_event_type, nullif(trim(p_note), ''))
  returning * into v_event;

  select * into v_resource
  from public.resources
  where id = v_match.resource_id
  for update;

  select * into v_need
  from public.needs
  where id = v_match.need_id
  for update;

  if p_event_type = 'received' then
    update public.matches
    set status = 'completed',
        updated_at = now()
    where id = p_match;

    update public.needs
    set status = 'resolved',
        updated_at = now()
    where id = v_need.id;

    update public.resources
    set status = 'fulfilled',
        updated_at = now()
    where id = v_resource.id;
  elsif p_event_type = 'cancelled' then
    update public.matches
    set status = 'cancelled',
        updated_at = now()
    where id = p_match;

    update public.needs
    set status = 'open',
        updated_at = now()
    where id = v_need.id
      and status = 'matched';

    update public.resources
    set status = 'verified',
        updated_at = now()
    where id = v_resource.id
      and status = 'reserved';
  end if;

  return v_event;
end;
$$;

grant execute on function public.record_outcome_event(uuid, text, text) to authenticated;
