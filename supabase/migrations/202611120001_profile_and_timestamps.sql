-- NEXORA AI / profile automation and timestamp maintenance
-- Run after 202611110001_initial_core.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_language, account_type)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    case
      when new.raw_user_meta_data ->> 'preferred_language' in ('en','ar','fa')
        then new.raw_user_meta_data ->> 'preferred_language'
      else 'en'
    end,
    case
      when new.raw_user_meta_data ->> 'account_type' in ('individual','provider','organization','volunteer')
        then new.raw_user_meta_data ->> 'account_type'
      else 'individual'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists needs_set_updated_at on public.needs;
create trigger needs_set_updated_at before update on public.needs
for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();
