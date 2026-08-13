-- Kusinang Pamana — order lookup, deposits, payment proofs.
-- Run AFTER supabase/schema.sql and supabase/orders.sql (reuses
-- public.set_updated_at() and public.is_admin()). Paste into the Supabase
-- SQL Editor and run once; safe to re-run.
--
-- NOTE ON FUNCTION GRANTS: Postgres grants EXECUTE on new functions to
-- PUBLIC by default, and PostgREST exposes every public-schema function as
-- an RPC endpoint. Each function below therefore revokes from public and
-- re-grants explicitly. Do not skip those lines.


-- =====================================================================
-- 1. Order numbers: unique by construction, unguessable by design
-- =====================================================================
-- app/order/confirm/actions.ts used to build
-- `KP-${year}-${Date.now().toString().slice(-5)}`, which repeats every 100
-- seconds against a UNIQUE column — the duplicate-key error reached the
-- customer AFTER their OTP was already consumed.
--
-- The sequence guarantees uniqueness. The random block matters just as
-- much: an order number is half the credential for public.lookup_order
-- below, so a plain sequential number would be trivially enumerable.

create sequence if not exists public.order_number_seq;

create or replace function public.next_order_number()
returns text
language sql
volatile
as $$
  select 'KP-' || to_char(now() at time zone 'Asia/Manila', 'YYYY')
      || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')
      || '-' || upper(encode(gen_random_bytes(2), 'hex'));
$$;

-- The DEFAULT expression runs as the *inserting* role, so both the
-- function and the sequence need grants.
revoke all on function public.next_order_number() from public;
grant execute on function public.next_order_number() to anon, authenticated;
grant usage on sequence public.order_number_seq to anon, authenticated;

alter table public.orders
  alter column order_number set default public.next_order_number();


-- =====================================================================
-- 2. Deposit + denormalized payment state on orders
-- =====================================================================
-- amount_paid / payment_status are DERIVED. They are written by exactly
-- one thing: the recompute trigger in section 5. Application code must
-- never include them in an INSERT or UPDATE payload.
-- deposit_amount is the opposite: a snapshot, frozen at order time, so a
-- later change to DEPOSIT_PERCENT can never move an existing order's
-- reservation fee.

alter table public.orders add column if not exists deposit_amount numeric not null default 0;
alter table public.orders add column if not exists amount_paid     numeric not null default 0;
alter table public.orders add column if not exists payment_status  text    not null default 'Unpaid';

do $$ begin
  alter table public.orders add constraint orders_payment_status_check
    check (payment_status in
      ('Unpaid', 'Awaiting Verification', 'Partially Paid', 'Deposit Paid', 'Paid'));
exception when duplicate_object then null; end $$;

create index if not exists orders_payment_status_idx on public.orders(payment_status);


-- =====================================================================
-- 3. The customer may read their own order back
-- =====================================================================
-- Needed so the OTP-scoped insert in app/order/confirm/actions.ts can use
-- .select() to read back the DB-generated order_number. PostgREST's
-- RETURNING is checked against the SELECT policy, and until now customers
-- had none. Scoped to the email they proved ownership of, same as insert.

drop policy if exists "Customer read own order" on public.orders;
create policy "Customer read own order"
  on public.orders
  for select
  to authenticated
  using (email = auth.email());


-- =====================================================================
-- 4. payments
-- =====================================================================
-- Multiple rows per order by design: a reservation deposit now, the
-- balance later, plus whatever partial payments reality produces.

create table if not exists public.payments (
  id       uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,

  kind   text not null default 'Deposit' check (kind in ('Deposit', 'Balance', 'Other')),
  method text not null check (method in ('Cash', 'GCash', 'Bank Transfer')),
  amount numeric not null check (amount > 0),

  reference_number text,
  -- Minted server-side by begin_payment(), never accepted from a client.
  -- UNIQUE so a path can be claimed by at most one payment row.
  proof_path text unique,

  -- 'Pending Upload' = row exists, file has not landed yet. Invisible to
  -- both the admin queue and the customer until finalize_payment() flips
  -- it to 'Submitted', so a failed upload never pollutes the queue.
  status text not null default 'Pending Upload'
    check (status in ('Pending Upload', 'Submitted', 'Verified', 'Rejected')),

  admin_note  text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Cash is settled in person: no reference, no screenshot. Every online
  -- method must carry both.
  constraint payments_online_proof_required check (
    method = 'Cash'
    or (coalesce(trim(reference_number), '') <> '' and coalesce(proof_path, '') <> '')
  )
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_queue_idx    on public.payments(status, created_at desc);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row
  execute function public.set_updated_at();


-- =====================================================================
-- 5. The one writer of orders.amount_paid / orders.payment_status
-- =====================================================================
-- Recomputed from scratch on every change rather than incremented, so the
-- denormalized columns cannot drift away from public.payments. security
-- definer because the callers (anon via RPC, admins via RLS) have no
-- direct UPDATE right on orders.

create or replace function public.recompute_order_payment_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := coalesce(new.order_id, old.order_id);
  v_total    numeric;
  v_deposit  numeric;
  v_verified numeric;
  v_pending  integer;
  v_status   text;
begin
  select total, deposit_amount into v_total, v_deposit
    from public.orders where id = v_order_id;
  if not found then return null; end if;

  select coalesce(sum(amount) filter (where status = 'Verified'), 0),
         count(*)             filter (where status = 'Submitted')
    into v_verified, v_pending
    from public.payments where order_id = v_order_id;

  v_status := case
    when v_verified >= v_total                      then 'Paid'
    when v_pending > 0                               then 'Awaiting Verification'
    when v_verified >= v_deposit and v_verified > 0  then 'Deposit Paid'
    when v_verified > 0                              then 'Partially Paid'
    else 'Unpaid'
  end;

  update public.orders
     set amount_paid = v_verified, payment_status = v_status
   where id = v_order_id
     and (amount_paid is distinct from v_verified
          or payment_status is distinct from v_status);

  return null;
end;
$$;

drop trigger if exists payments_recompute_order_state on public.payments;
create trigger payments_recompute_order_state
  after insert or update or delete on public.payments
  for each row
  execute function public.recompute_order_payment_state();


-- =====================================================================
-- 6. payments RLS — no anonymous write path at the table level
-- =====================================================================
-- There is deliberately NO customer INSERT policy. Customers are anonymous
-- at /order/track, and NEXT_PUBLIC_SUPABASE_ANON_KEY ships in the browser
-- bundle, so any policy written for `anon` here would be world-writable.
-- The only way to create a customer payment is public.begin_payment()
-- below, which re-checks order_number + contact inside a security definer
-- function.

alter table public.payments enable row level security;

revoke insert, update, delete on public.payments from anon;

drop policy if exists "Admin read payments" on public.payments;
create policy "Admin read payments"
  on public.payments for select to authenticated using (public.is_admin());

drop policy if exists "Admin insert payments" on public.payments;
create policy "Admin insert payments"          -- admin logging an in-person cash payment
  on public.payments for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin update payments" on public.payments;
create policy "Admin update payments"
  on public.payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin delete payments" on public.payments;
create policy "Admin delete payments"
  on public.payments for delete to authenticated using (public.is_admin());


-- =====================================================================
-- 7. Contact matching + masking helpers
-- =====================================================================
-- PH mobile numbers arrive as +63 917 123 4567 / 0917 123 4567 /
-- 9171234567. Reduce every form to the trailing 10 digits.

create or replace function public.normalize_ph_phone(p text)
returns text language sql immutable as $$
  select case when p is null then null
              else right(regexp_replace(p, '\D', '', 'g'), 10) end;
$$;

create or replace function public.mask_email(p text)
returns text language sql immutable as $$
  select case when p is null or position('@' in p) = 0 then null
              else left(split_part(p, '@', 1), 1) || '•••@' || split_part(p, '@', 2) end;
$$;

create or replace function public.mask_phone(p text)
returns text language sql immutable as $$
  select case when p is null then null
              else '•••• ••• ' || right(regexp_replace(p, '\D', '', 'g'), 4) end;
$$;


-- =====================================================================
-- 8. public.lookup_order — the customer's only read path
-- =====================================================================
-- security definer so it can read a table whose RLS is admin-only. The
-- credential is order_number AND (email OR mobile), both required, exact
-- match, one row. Email is compared case-insensitively; phone through
-- normalize_ph_phone. Email/phone come back MASKED: matching on the phone
-- must not hand back the email address in clear.

create or replace function public.lookup_order(p_order_number text, p_contact text)
returns table (
  id uuid, order_number text, status text,
  package_name text, menu_name text, menu_snapshot jsonb,
  quantity_label text, pax integer,
  event_type text, event_date date, event_time text, venue text,
  branch text, delivery_method text, delivery_time text, address text,
  instructions text,
  first_name text, last_name text, email_masked text, phone_masked text,
  subtotal numeric, delivery_fee numeric, total numeric,
  deposit_amount numeric, amount_paid numeric, payment_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_number  text := upper(trim(coalesce(p_order_number, '')));
  v_contact text := trim(coalesce(p_contact, ''));
  v_digits  text := regexp_replace(coalesce(p_contact, ''), '\D', '', 'g');
begin
  -- Both halves required. An empty contact must never match a row whose
  -- email or phone happens to be blank.
  if v_number = '' or v_contact = '' then
    return;
  end if;

  return query
  select o.id, o.order_number, o.status,
         o.package_name, o.menu_name, o.menu_snapshot,
         o.quantity_label, o.pax,
         o.event_type, o.event_date, o.event_time, o.venue,
         o.branch, o.delivery_method, o.delivery_time, o.address,
         o.instructions,
         o.first_name, o.last_name,
         public.mask_email(o.email), public.mask_phone(o.phone),
         o.subtotal, o.delivery_fee, o.total,
         o.deposit_amount, o.amount_paid, o.payment_status,
         o.created_at
    from public.orders o
   where upper(o.order_number) = v_number
     and (
       lower(o.email) = lower(v_contact)
       or (length(v_digits) >= 7                       -- no 4-digit fishing
           and public.normalize_ph_phone(o.phone) = public.normalize_ph_phone(v_contact))
     )
   limit 1;
end;
$$;

revoke all on function public.lookup_order(text, text) from public;
grant execute on function public.lookup_order(text, text) to anon, authenticated;


-- =====================================================================
-- 9. public.lookup_order_payments
-- =====================================================================
-- Same credential, the payment history. Deliberately does NOT return
-- proof_path: a storage path is a capability, and the customer has no
-- reason to hold one.

create or replace function public.lookup_order_payments(p_order_number text, p_contact text)
returns table (
  id uuid, kind text, method text, amount numeric,
  reference_number text, status text,
  created_at timestamptz, verified_at timestamptz
)
language plpgsql security definer set search_path = public stable
as $$
declare v_order_id uuid;
begin
  select l.id into v_order_id from public.lookup_order(p_order_number, p_contact) l;
  if v_order_id is null then return; end if;

  return query
    select p.id, p.kind, p.method, p.amount, p.reference_number,
           p.status, p.created_at, p.verified_at
      from public.payments p
     where p.order_id = v_order_id
       and p.status <> 'Pending Upload'
     order by p.created_at;
end;
$$;

revoke all on function public.lookup_order_payments(text, text) from public;
grant execute on function public.lookup_order_payments(text, text) to anon, authenticated;


-- =====================================================================
-- 10. public.begin_payment — mints the row and the upload capability
-- =====================================================================

create or replace function public.begin_payment(
  p_order_number     text,
  p_contact          text,
  p_method           text,
  p_amount           numeric,
  p_reference_number text,
  p_proof_ext        text default 'jpg'
)
returns table (payment_id uuid, proof_path text)
language plpgsql security definer set search_path = public volatile
as $$
declare
  v_order_id   uuid;
  v_total      numeric;
  v_paid       numeric;
  v_deposit    numeric;
  v_payment_id uuid := gen_random_uuid();
  v_kind       text;
  v_path       text;
  v_ext        text := lower(coalesce(nullif(trim(p_proof_ext), ''), 'jpg'));
begin
  select l.id, l.total, l.amount_paid, l.deposit_amount
    into v_order_id, v_total, v_paid, v_deposit
    from public.lookup_order(p_order_number, p_contact) l;
  if v_order_id is null then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_method not in ('Cash', 'GCash', 'Bank Transfer') then
    raise exception 'BAD_METHOD' using errcode = '22023';
  end if;

  -- The amount is re-derived against the server's own numbers. A client
  -- cannot declare ₱1 against a ₱50,000 order, and cannot overpay.
  if p_amount is null or p_amount <= 0 then
    raise exception 'BAD_AMOUNT' using errcode = '22023';
  end if;
  if p_amount > (v_total - v_paid) + 0.5 then
    raise exception 'AMOUNT_EXCEEDS_BALANCE' using errcode = '22023';
  end if;

  -- kind is derived, never trusted from the client.
  v_kind := case when v_paid < v_deposit then 'Deposit' else 'Balance' end;

  -- Abuse limits. Someone who legitimately knows one order number can
  -- still poke at it; they cannot turn it into unlimited bucket writes.
  if exists (select 1 from public.payments
              where order_id = v_order_id
                and status = 'Pending Upload'
                and created_at > now() - interval '15 minutes') then
    raise exception 'PAYMENT_ALREADY_PENDING' using errcode = '23505';
  end if;
  if (select count(*) from public.payments
       where order_id = v_order_id
         and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'TOO_MANY_ATTEMPTS' using errcode = '53400';
  end if;

  if p_method = 'Cash' then
    insert into public.payments (id, order_id, kind, method, amount, reference_number, status)
    values (v_payment_id, v_order_id, v_kind, p_method,
            p_amount, nullif(trim(p_reference_number), ''), 'Submitted');
    return query select v_payment_id, null::text;
    return;
  end if;

  if coalesce(trim(p_reference_number), '') = '' then
    raise exception 'REFERENCE_REQUIRED' using errcode = '22023';
  end if;
  if v_ext !~ '^(jpg|jpeg|png|webp|heic)$' then
    raise exception 'BAD_EXTENSION' using errcode = '22023';
  end if;

  -- The path is generated HERE and never accepted from a client. Paired
  -- with the storage policy in section 12, writing it is a single-use,
  -- 15-minute capability rather than open bucket access.
  v_path := v_order_id::text || '/' || v_payment_id::text || '-'
            || encode(gen_random_bytes(8), 'hex') || '.' || v_ext;

  insert into public.payments
    (id, order_id, kind, method, amount, reference_number, proof_path, status)
  values
    (v_payment_id, v_order_id, v_kind, p_method,
     p_amount, trim(p_reference_number), v_path, 'Pending Upload');

  return query select v_payment_id, v_path;
end;
$$;

revoke all on function public.begin_payment(text, text, text, numeric, text, text) from public;
grant execute on function public.begin_payment(text, text, text, numeric, text, text)
  to anon, authenticated;


-- =====================================================================
-- 11. public.finalize_payment — proves the file landed, opens the queue
-- =====================================================================

create or replace function public.finalize_payment(
  p_order_number text, p_contact text, p_payment_id uuid
)
returns boolean
language plpgsql security definer set search_path = public volatile
as $$
declare v_order_id uuid; v_rows integer;
begin
  select l.id into v_order_id from public.lookup_order(p_order_number, p_contact) l;
  if v_order_id is null then return false; end if;

  -- The storage.objects existence check is what stops a caller from
  -- flooding the admin queue with Submitted rows that have no screenshot.
  update public.payments p
     set status = 'Submitted'
   where p.id = p_payment_id
     and p.order_id = v_order_id
     and p.status = 'Pending Upload'
     and exists (select 1 from storage.objects o
                  where o.bucket_id = 'payment-proofs' and o.name = p.proof_path);

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.finalize_payment(text, text, uuid) from public;
grant execute on function public.finalize_payment(text, text, uuid) to anon, authenticated;


-- =====================================================================
-- 12. Storage: payment-proofs
-- =====================================================================
-- NOT public. Proofs are financial records. Admins read via short-lived
-- signed URLs; nobody else reads at all.
-- If this INSERT errors with "must be owner of table buckets", create the
-- bucket in the Storage UI instead (private, 5 MB, image mime types) and
-- run only the policies below.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- security definer so a storage.objects policy never has to read
-- public.payments under the caller's (admin-only) RLS.
create or replace function public.proof_path_is_claimed(p_name text)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.payments
     where proof_path = p_name
       and status = 'Pending Upload'
       and created_at > now() - interval '15 minutes'
  );
$$;

revoke all on function public.proof_path_is_claimed(text) from public;
grant execute on function public.proof_path_is_claimed(text) to anon, authenticated;

drop policy if exists "Proof upload against a claimed path" on storage.objects;
create policy "Proof upload against a claimed path"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and public.proof_path_is_claimed(name));

drop policy if exists "Admin read proofs" on storage.objects;
create policy "Admin read proofs"           -- createSignedUrl needs SELECT
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "Admin delete proofs" on storage.objects;
create policy "Admin delete proofs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Deliberately NO update policy on this bucket: an object is written
-- exactly once, so a verified proof can never be swapped for another
-- image after the fact.


-- =====================================================================
-- 13. OPTIONAL — cross-instance lookup throttle
-- =====================================================================
-- The in-process throttle in app/order/track/actions.ts is per-instance.
-- If you deploy to more than one instance, uncomment this and call
-- public.throttle_lookup(<ip or order number>) at the top of the action.
--
-- create table if not exists public.lookup_attempts (
--   key text primary key,
--   window_start timestamptz not null default now(),
--   count integer not null default 0
-- );
-- create or replace function public.throttle_lookup(p_key text, p_max integer default 10)
-- returns boolean language plpgsql security definer set search_path = public as $$
-- declare v_count integer;
-- begin
--   insert into public.lookup_attempts (key, count) values (p_key, 1)
--   on conflict (key) do update
--     set count = case when public.lookup_attempts.window_start < now() - interval '10 minutes'
--                      then 1 else public.lookup_attempts.count + 1 end,
--         window_start = case when public.lookup_attempts.window_start < now() - interval '10 minutes'
--                             then now() else public.lookup_attempts.window_start end
--   returning count into v_count;
--   return v_count <= p_max;
-- end; $$;

-- Housekeeping: 'Pending Upload' rows whose upload never landed are dead
-- weight. They're invisible to the queue and to the customer, so it's
-- cosmetic — sweep them occasionally, e.g. via pg_cron or by hand:
--   delete from public.payments
--    where status = 'Pending Upload' and created_at < now() - interval '1 day';
