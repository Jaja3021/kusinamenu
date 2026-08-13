-- Adds branch targeting to packages. Safe to re-run.
-- NULL / empty array = available at every branch (the common case).
-- Values match app/order/confirm/page.tsx's BRANCHES ids: 'cavite', 'laguna', 'metro-manila'.

alter table public.packages add column if not exists branch text[];
