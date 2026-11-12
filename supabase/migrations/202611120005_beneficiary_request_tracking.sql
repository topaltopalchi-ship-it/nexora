-- Add the beneficiary-facing information-request state in its own migration
-- so it is committed before any later migration uses the enum value.
alter type public.need_status add value if not exists 'information_requested';
