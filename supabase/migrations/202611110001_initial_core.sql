-- NEXORA AI / initial core schema
-- Apply only to the dedicated NEXORA project after provisioning.
-- Sensitive crisis/medical records are intentionally excluded from this MVP schema.

create extension if not exists pgcrypto;
create type public.need_category as enum ('food', 'healthcare', 'housing', 'transport', 'other');
create type public.need_status as enum ('open', 'reviewing', 'matched', 'in_progress', 'resolved', 'closed');
create type public.resource_status as enum ('draft', 'pending_review', 'verified', 'reserved', 'fulfilled', 'expired', 'suspended');
create type public.match_status as enum ('proposed', 'accepted', 'rejected', 'cancelled', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en','ar','fa')),
  account_type text not null default 'individual' check (account_type in ('individual','provider','organization','volunteer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null,
  city text not null default 'Tabriz',
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (member_role in ('owner','reviewer','coordinator')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table public.needs (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id),
  category public.need_category not null,
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 3000),
  city text not null default 'Tabriz',
  urgency smallint not null default 3 check (urgency between 1 and 5),
  people_count integer not null default 1 check (people_count between 1 and 100),
  preferred_language text not null default 'en' check (preferred_language in ('en','ar','fa')),
  status public.need_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id),
  organization_id uuid references public.organizations(id),
  category public.need_category not null,
  title text not null check (char_length(title) between 4 and 120),
  public_summary text not null check (char_length(public_summary) between 10 and 1000),
  city text not null default 'Tabriz',
  quantity integer not null default 1 check (quantity between 1 and 10000),
  available_until timestamptz,
  status public.resource_status not null default 'pending_review',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.needs(id),
  resource_id uuid not null references public.resources(id),
  requester_id uuid not null references auth.users(id),
  provider_id uuid not null references auth.users(id),
  status public.match_status not null default 'proposed',
  human_review_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (need_id, resource_id)
);
create table public.outcome_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id),
  actor_id uuid not null references auth.users(id),
  event_type text not null check (event_type in ('reserved','collected','delivered','received','cancelled','follow_up')),
  note text,
  created_at timestamptz not null default now()
);

create index needs_requester_idx on public.needs(requester_id, created_at desc);
create index needs_queue_idx on public.needs(status, category, urgency desc, created_at);
create index resources_discovery_idx on public.resources(status, category, city, available_until);
create index resources_provider_idx on public.resources(provider_id, created_at desc);
create index matches_requester_idx on public.matches(requester_id, created_at desc);
create index matches_provider_idx on public.matches(provider_id, created_at desc);
create index outcome_match_idx on public.outcome_events(match_id, created_at);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.needs enable row level security;
alter table public.resources enable row level security;
alter table public.matches enable row level security;
alter table public.outcome_events enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select, insert, update on public.needs to authenticated;
grant select, insert, update on public.resources to authenticated;
grant select on public.matches to authenticated;
grant select, insert on public.outcome_events to authenticated;

create policy "profile owner reads own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profile owner creates own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profile owner updates own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "verified organizations visible to signed-in users" on public.organizations for select to authenticated using (verification_status = 'verified' or created_by = (select auth.uid()));
create policy "creator submits organization" on public.organizations for insert to authenticated with check (created_by = (select auth.uid()) and verification_status = 'pending');
create policy "members can view their memberships" on public.organization_members for select to authenticated using (user_id = (select auth.uid()));

create policy "requester reads own needs" on public.needs for select to authenticated using (requester_id = (select auth.uid()));
create policy "requester creates own need" on public.needs for insert to authenticated with check (requester_id = (select auth.uid()) and status = 'open');
create policy "requester updates own open needs" on public.needs for update to authenticated using (requester_id = (select auth.uid()) and status = 'open') with check (requester_id = (select auth.uid()) and status = 'open');

create policy "published resources visible to signed-in users" on public.resources for select to authenticated using (status = 'verified' or provider_id = (select auth.uid()));
create policy "provider submits resource for review" on public.resources for insert to authenticated with check (provider_id = (select auth.uid()) and status = 'pending_review' and verified_at is null);
create policy "provider updates own unverified resources" on public.resources for update to authenticated using (provider_id = (select auth.uid()) and status in ('draft','pending_review')) with check (provider_id = (select auth.uid()) and status in ('draft','pending_review') and verified_at is null);

create policy "match participants can view matches" on public.matches for select to authenticated using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()));
create policy "match participants can view outcome events" on public.outcome_events for select to authenticated using (
  exists (select 1 from public.matches m where m.id = outcome_events.match_id and (m.requester_id = (select auth.uid()) or m.provider_id = (select auth.uid())))
);
create policy "participants can append outcome events" on public.outcome_events for insert to authenticated with check (
  actor_id = (select auth.uid()) and exists (
    select 1 from public.matches m where m.id = outcome_events.match_id and (m.requester_id = (select auth.uid()) or m.provider_id = (select auth.uid()))
  )
);

-- Client users cannot create matches or change match status.
-- Verification/matching must run through trusted server workflows with human approval gates.
\n\n-- Virtual Tabriz commerce foundation\ncreate table public.market_stores (\n  id uuid primary key default gen_random_uuid(),\n  owner_id uuid not null references auth.users(id),\n  name text not null,\n  description text not null,\n  city text not null default 'Tabriz',\n  district text not null,\n  address text,\n  latitude numeric,\n  longitude numeric,\n  voice_enabled boolean not null default true,\n  verification_status text not null default 'pending' check (verification_status in ('pending','verified','suspended')),\n  created_at timestamptz not null default now(),\n  updated_at timestamptz not null default now()\n);\ncreate table public.market_products (\n  id uuid primary key default gen_random_uuid(),\n  store_id uuid not null references public.market_stores(id) on delete cascade,\n  name text not null,\n  description text not null default '',\n  price numeric(12,2) not null check (price >= 0),\n  currency text not null default 'IRR',\n  stock integer not null default 0 check (stock >= 0),\n  image_url text,\n  active boolean not null default true,\n  created_at timestamptz not null default now(),\n  updated_at timestamptz not null default now()\n);\ncreate index market_stores_city_district_idx on public.market_stores(city, district);\ncreate index market_products_store_idx on public.market_products(store_id, active);\nalter table public.market_stores enable row level security;\nalter table public.market_products enable row level security;\ngrant select on public.market_stores, public.market_products to authenticated;\ngrant insert, update on public.market_stores to authenticated;\ngrant insert, update on public.market_products to authenticated;\ncreate policy "verified stores visible to users" on public.market_stores for select to authenticated using (verification_status = 'verified' or owner_id = (select auth.uid()));\ncreate policy "store owner creates store" on public.market_stores for insert to authenticated with check (owner_id = (select auth.uid()) and verification_status = 'pending');\ncreate policy "store owner edits pending store" on public.market_stores for update to authenticated using (owner_id = (select auth.uid()) and verification_status = 'pending') with check (owner_id = (select auth.uid()) and verification_status = 'pending');\ncreate policy "products of visible stores are readable" on public.market_products for select to authenticated using (active = true and exists (select 1 from public.market_stores s where s.id = store_id and (s.verification_status = 'verified' or s.owner_id = (select auth.uid()))));\ncreate policy "store owner creates products" on public.market_products for insert to authenticated with check (exists (select 1 from public.market_stores s where s.id = store_id and s.owner_id = (select auth.uid())));\ncreate policy "store owner updates products" on public.market_products for update to authenticated using (exists (select 1 from public.market_stores s where s.id = store_id and s.owner_id = (select auth.uid())));\n

-- Commerce transaction and seller conversation foundation
create type public.market_order_status as enum ('pending','confirmed','packing','shipped','delivered','cancelled');
create table public.market_orders (id uuid primary key default gen_random_uuid(), customer_id uuid not null references auth.users(id), store_id uuid not null references public.market_stores(id), status public.market_order_status not null default 'pending', delivery_address text not null, customer_note text, total numeric(14,2) not null default 0 check (total >= 0), currency text not null default 'IRR', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.market_order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.market_orders(id) on delete cascade, product_id uuid not null references public.market_products(id), quantity integer not null check (quantity > 0), unit_price numeric(12,2) not null check (unit_price >= 0), created_at timestamptz not null default now());
create table public.market_voice_sessions (id uuid primary key default gen_random_uuid(), store_id uuid not null references public.market_stores(id), customer_id uuid not null references auth.users(id), seller_id uuid references auth.users(id), status text not null default 'requested' check (status in ('requested','accepted','active','ended','declined')), started_at timestamptz, ended_at timestamptz, created_at timestamptz not null default now());
create index market_orders_customer_idx on public.market_orders(customer_id, created_at desc); create index market_orders_store_idx on public.market_orders(store_id, status, created_at desc); create index market_voice_store_idx on public.market_voice_sessions(store_id, status, created_at desc);
alter table public.market_orders enable row level security; alter table public.market_order_items enable row level security; alter table public.market_voice_sessions enable row level security;
grant select, insert on public.market_orders to authenticated; grant select, insert on public.market_order_items to authenticated; grant select, insert, update on public.market_voice_sessions to authenticated;
create policy "customer creates own order" on public.market_orders for insert to authenticated with check (customer_id = (select auth.uid()));
create policy "order participants can view order" on public.market_orders for select to authenticated using (customer_id = (select auth.uid()) or exists (select 1 from public.market_stores s where s.id = store_id and s.owner_id = (select auth.uid())));
create policy "customer adds own order items" on public.market_order_items for insert to authenticated with check (exists (select 1 from public.market_orders o where o.id = order_id and o.customer_id = (select auth.uid())));
create policy "order participants view items" on public.market_order_items for select to authenticated using (exists (select 1 from public.market_orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or exists (select 1 from public.market_stores s where s.id = o.store_id and s.owner_id = (select auth.uid())))));
create policy "customer requests voice session" on public.market_voice_sessions for insert to authenticated with check (customer_id = (select auth.uid()));
create policy "voice participants view session" on public.market_voice_sessions for select to authenticated using (customer_id = (select auth.uid()) or seller_id = (select auth.uid()) or exists (select 1 from public.market_stores s where s.id = store_id and s.owner_id = (select auth.uid())));
create policy "voice participants update session" on public.market_voice_sessions for update to authenticated using (customer_id = (select auth.uid()) or seller_id = (select auth.uid()) or exists (select 1 from public.market_stores s where s.id = store_id and s.owner_id = (select auth.uid())));
