create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  category text not null,
  city text not null default 'Tabriz',
  neighborhood text,
  address text,
  is_open boolean not null default true,
  status text not null default 'draft' check (status in ('draft','pending_review','published','suspended')),
  cover_url text,
  virtual_scene_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric(14,2) not null default 0,
  currency text not null default 'IRR',
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  store_id uuid not null references public.stores(id) on delete restrict,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','preparing','ready','delivering','completed','cancelled')),
  total numeric(14,2) not null default 0,
  currency text not null default 'IRR',
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null,
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;
alter table public.store_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "published stores are public" on public.stores for select using (status='published');
create policy "active products are public" on public.store_products for select using (is_active=true and exists (select 1 from public.stores s where s.id=store_id and s.status='published'));

create policy "customers see own orders" on public.orders for select using (customer_id=auth.uid());
create policy "customers create orders" on public.orders for insert with check (customer_id=auth.uid());
create policy "customers see own order items" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
create policy "customers add own order items" on public.order_items for insert with check (exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));

create index if not exists stores_city_status_idx on public.stores(city,status);
create index if not exists stores_neighborhood_idx on public.stores(neighborhood);
create index if not exists store_products_store_idx on public.store_products(store_id);
create index if not exists orders_customer_idx on public.orders(customer_id);
create index if not exists order_items_order_idx on public.order_items(order_id);
