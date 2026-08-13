-- Kusinang Pamana — package visibility + expanded order status timeline.
-- Run AFTER schema.sql, orders.sql, packages_branch.sql, payments.sql.
-- Paste into the Supabase SQL Editor and run once; safe to re-run.
--
-- Written to support: (1) an admin "Active/Inactive" toggle per package in
-- herbies-dashboard's /dashboard/menu, honored by herbies' storefront
-- (app/page.tsx) so a package can be hidden without deleting it; (2) two
-- additional order statuses ("Cooking", "Ready for Delivery") so the
-- client-facing 6-step tracking timeline has a real status behind every
-- step, settable from either dashboard's order status dropdown.

-- ---------------------------------------------------------------------
-- 1. Package visibility
-- ---------------------------------------------------------------------
-- Default true so every existing package stays visible on the storefront
-- the moment this runs — nothing disappears until an admin explicitly
-- flips it off.

alter table public.packages add column if not exists active boolean not null default true;

create index if not exists packages_active_idx on public.packages(active);

-- ---------------------------------------------------------------------
-- 2. Two new order statuses
-- ---------------------------------------------------------------------
-- The column's check constraint was declared inline in orders.sql without
-- an explicit name, so Postgres auto-named it "orders_status_check" —
-- that's what we drop and recreate here. Existing rows are unaffected:
-- every value that was previously valid remains valid.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'Pending Confirmation',
    'Confirmed',
    'Preparing',
    'Cooking',
    'Ready for Delivery',
    'Completed',
    'Cancelled'
  ));
