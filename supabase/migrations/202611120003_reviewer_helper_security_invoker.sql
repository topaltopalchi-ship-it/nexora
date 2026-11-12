-- The boolean helper runs with caller permissions and can only read the caller's own reviewer row.
create or replace function public.is_platform_reviewer()
returns boolean
language sql
stable
security invoker
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
