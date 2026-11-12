-- Extend provider-submitted resources with structured offer details.
-- All new offers remain pending review; this migration does not publish or auto-match them.
alter table public.resources
  add column if not exists resource_type text not null default 'other'
    check (resource_type in ('food_parcels','meals','clothing','medicine','medical_consultation','accommodation','transport','other')),
  add column if not exists provider_type text not null default 'individual'
    check (provider_type in ('individual','restaurant','healthcare_provider','pharmacy','charity','accommodation_provider','company')),
  add column if not exists unit text not null default 'items'
    check (unit in ('items','meals','food_parcels','people','consultations','hours','sets')),
  add column if not exists expiry_date date;

create index if not exists resources_type_review_idx
  on public.resources(status, resource_type, city);

comment on column public.resources.resource_type is
  'Structured type of assistance offered; sensitive offers require additional human verification.';
comment on column public.resources.expiry_date is
  'Optional expiry date for perishable or time-limited donated goods; never implies suitability or approval.';

-- Enforce provider-type guardrails in the database as well as in the form.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resources_sensitive_provider_check'
      and conrelid = 'public.resources'::regclass
  ) then
    alter table public.resources
      add constraint resources_sensitive_provider_check check (
        (resource_type <> 'medicine' or provider_type = 'pharmacy')
        and (resource_type <> 'medical_consultation' or provider_type = 'healthcare_provider')
        and (resource_type <> 'accommodation' or provider_type in ('accommodation_provider','charity'))
      );
  end if;
end $$;
