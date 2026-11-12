-- Harden trigger-only SECURITY DEFINER functions and support foreign-key lookups.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- These two SECURITY DEFINER RPCs are intentionally callable by authenticated users:
-- is_platform_reviewer returns only the caller's boolean role state; review_resource
-- checks that role again and only processes pending resources.
create index if not exists matches_resource_idx on public.matches(resource_id);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organizations_created_by_idx on public.organizations(created_by);
create index if not exists outcome_events_actor_idx on public.outcome_events(actor_id);
create index if not exists platform_reviewers_granted_by_idx on public.platform_reviewers(granted_by);
create index if not exists resource_reviews_reviewer_idx on public.resource_reviews(reviewer_id);
create index if not exists resources_organization_idx on public.resources(organization_id);

-- Combine public-resource and reviewer-queue visibility into one SELECT policy.
drop policy if exists "published resources visible to signed-in users" on public.resources;
drop policy if exists "trusted reviewers read pending resources" on public.resources;
create policy "providers and reviewers read permitted resources"
  on public.resources for select to authenticated
  using (
    status = 'verified'
    or provider_id = (select auth.uid())
    or (status = 'pending_review' and public.is_platform_reviewer())
  );
