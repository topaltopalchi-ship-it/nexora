-- Add an explicit rejected state before creating review functions that use it.
alter type public.resource_status add value if not exists 'rejected';
