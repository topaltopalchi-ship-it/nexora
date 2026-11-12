-- Trusted, server-enforced resource review for the NEXORA pilot.
-- Only trusted database administrators may grant reviewer access.

create table public.platform_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id)
);

alter table public.platform_reviewers enable row level security;
revoke all on public.platform_reviewers from anon, authenticated;
grant select on public.platform_reviewers to authenticated;
create policy "reviewers can inspect their own reviewer grant"
  on public.platform_reviewers for select to authenticated
  using (user_id = (select auth.uid()));

create table public.resource_reviews (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved','rejected')),
  note text check (note is null or char_length(note) <= 1000),
  reviewed_at timestamptz not null default now()
);
create index resource_reviews_resource_idx
  on public.resource_reviews(resource_id, reviewed_at desc);
alter table public.resource_reviews enable row level security;
revoke all on public.resource_reviews from anon, authenticated;
grant select on public.resource_reviews to authenticated;
create policy "trusted reviewers can read review audit"
  on public.resource_reviews for select to authenticated
  using (public.is_platform_reviewer());

-- SECURITY DEFINER is used only for the two narrowly-scoped review operations.
-- Fully qualified names and an empty search_path prevent object-shadowing attacks.
create or replace function public.is_platform_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_reviewers r
    where r.user_id = (select auth.uid())
      and r.active = true
  );
$$;

revoke all on function public.is_platform_reviewer() from public, anon;
grant execute on function public.is_platform_reviewer() to authenticated;

-- A reviewer can only approve/reject a resource that is currently awaiting review.
-- The provider cannot call this successfully unless they have a separately granted reviewer role.
create or replace function public.review_resource(
  p_resource_id uuid,
  p_decision text,
  p_note text default null
)
returns public.resource_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reviewer uuid := (select auth.uid());
  v_status public.resource_status;
begin
  if v_reviewer is null or not public.is_platform_reviewer() then
    raise exception 'Not authorized to review resources' using errcode = '42501';
  end if;

  if p_decision not in ('approved','rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;

  if p_note is not null and char_length(p_note) > 1000 then
    raise exception 'Review note is too long' using errcode = '22023';
  end if;

  update public.resources
  set status = case when p_decision = 'approved'
                    then 'verified'::public.resource_status
                    else 'rejected'::public.resource_status end,
      verified_at = case when p_decision = 'approved' then now() else null end,
      updated_at = now()
  where id = p_resource_id
    and status = 'pending_review'
  returning status into v_status;

  if v_status is null then
    raise exception 'Resource was not found or is no longer awaiting review' using errcode = 'P0002';
  end if;

  insert into public.resource_reviews(resource_id, reviewer_id, decision, note)
  values (p_resource_id, v_reviewer, p_decision, nullif(trim(p_note), ''));

  return v_status;
end;
$$;

revoke all on function public.review_resource(uuid, text, text) from public, anon;
grant execute on function public.review_resource(uuid, text, text) to authenticated;

-- Allow trusted reviewers to see only the pending queue; provider visibility remains unchanged.
create policy "trusted reviewers read pending resources"
  on public.resources for select to authenticated
  using (status = 'pending_review' and public.is_platform_reviewer());

-- A reviewer must be explicitly provisioned by a trusted operator in the Supabase SQL editor:
-- insert into public.platform_reviewers (user_id, granted_by)
-- select id, null from auth.users where email = 'trusted-reviewer@example.com';
