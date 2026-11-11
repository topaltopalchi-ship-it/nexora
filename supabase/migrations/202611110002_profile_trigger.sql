-- Create a profile row for each newly registered auth user.
-- This trigger runs in the database; it does not expose service-role credentials.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, preferred_language, account_type)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    case when new.raw_user_meta_data ->> 'preferred_language' in ('en','ar','fa')
      then new.raw_user_meta_data ->> 'preferred_language' else 'en' end,
    case when new.raw_user_meta_data ->> 'account_type' in ('individual','provider','organization','volunteer')
      then new.raw_user_meta_data ->> 'account_type' else 'individual' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
