-- Herbies / Kusinang Pamana — orders + admin identity
-- Run this AFTER supabase/schema.sql (reuses its public.set_updated_at()
-- trigger function). Paste into the Supabase SQL Editor and run once; safe
-- to re-run.

-- ---------------------------------------------------------------------
-- Admin identity
-- ---------------------------------------------------------------------
-- Once customers verify by email OTP they become `authenticated` too, so
-- "authenticated" can no longer mean "may edit the menu / see orders."
-- This table is the actual admin allowlist.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Admins can see who else is an admin; nobody else can read this table.
drop policy if exists "Admins can read admins" on public.admins;
create policy "Admins can read admins"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- security definer + fixed search_path: lets RLS policies check admin
-- membership without a policy having to select from admins directly
-- (which would recurse into this same check).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Tighten packages: "authenticated" is no longer admin-only once
-- customers can authenticate via OTP. Replace with public.is_admin().
-- ---------------------------------------------------------------------

drop policy if exists "Authenticated insert" on public.packages;
create policy "Admin insert"
  on public.packages
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Authenticated update" on public.packages;
create policy "Admin update"
  on public.packages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated delete" on public.packages;
create policy "Admin delete"
  on public.packages
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
-- Snapshotted, not normalized against packages: what a customer ordered
-- must never silently change because an admin later edits that package.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'Pending Confirmation'
    check (status in ('Pending Confirmation', 'Confirmed', 'Preparing', 'Completed', 'Cancelled')),

  package_slug text not null,
  package_name text not null,
  menu_id text,
  menu_name text,
  menu_snapshot jsonb not null,
  pax integer,
  quantity_label text,
  cart jsonb not null default '[]'::jsonb,
  packed_meal_cart jsonb not null default '[]'::jsonb,
  selected_dishes jsonb not null default '{}'::jsonb,

  event_type text,
  event_date date,
  event_time text,
  venue text,
  instructions text,
  branch text,
  delivery_time text,
  delivery_method text not null check (delivery_method in ('delivery', 'pickup')),

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address text,

  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  total numeric not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

alter table public.orders enable row level security;

-- The OTP-verified customer may file their own order (email must match
-- the token they just verified — no ordering on someone else's behalf).
drop policy if exists "Customer insert own order" on public.orders;
create policy "Customer insert own order"
  on public.orders
  for insert
  to authenticated
  with check (email = auth.email());

-- Orders contain customer PII — only admins can list/read/manage them.
-- (Customers see their own order via the localStorage copy the app keeps,
-- not by querying this table.)
drop policy if exists "Admin read orders" on public.orders;
create policy "Admin read orders"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders"
  on public.orders
  for delete
  to authenticated
  using (public.is_admin());
