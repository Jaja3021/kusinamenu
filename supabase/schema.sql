-- Herbies / Kusinang Pamana menu builder schema
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Safe to re-run: table/policy/trigger creation is guarded, and the seed
-- insert at the bottom uses ON CONFLICT DO NOTHING.

create extension if not exists "pgcrypto";

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('Tray Orders', 'Grazing', 'Full-Service Catering')),
  description text not null default '',
  recommended boolean not null default false,

  pax_tiers jsonb not null default '[]'::jsonb,
  full_menu jsonb,
  inclusions text[] not null default '{}',
  add_ons text[] not null default '{}',

  price_per_head numeric,
  minimum_head_count integer,
  head_count_menu jsonb,

  tray_catalog jsonb,
  packed_meal_catalog jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists packages_set_updated_at on public.packages;
create trigger packages_set_updated_at
  before update on public.packages
  for each row
  execute function public.set_updated_at();

alter table public.packages enable row level security;

-- Anyone (including the anonymous storefront visitor) can read the menu.
drop policy if exists "Public read access" on public.packages;
create policy "Public read access"
  on public.packages
  for select
  using (true);

-- Only signed-in dashboard users (Supabase Auth) can create/edit/delete packages.
drop policy if exists "Authenticated insert" on public.packages;
create policy "Authenticated insert"
  on public.packages
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update" on public.packages;
create policy "Authenticated update"
  on public.packages
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated delete" on public.packages;
create policy "Authenticated delete"
  on public.packages
  for delete
  to authenticated
  using (true);

-- Seed data migrated from data/packages.json (6 packages).
insert into public.packages (slug, name, category, description, recommended, pax_tiers, full_menu, inclusions, add_ons, price_per_head, minimum_head_count, head_count_menu, tray_catalog, packed_meal_catalog)
values
  ('party-trays', 'Party Trays', 'Tray Orders', 'Build your own party trays — mix and match Filipino favorites by category and size.', true, '[]'::jsonb, NULL, ARRAY['Foil-sealed party trays', 'Serving tongs and ladles', 'Disposable plates and utensils', 'Free delivery within city limits']::text[], ARRAY['Extra tray (any dish) — ₱850', 'Rush order (within 24 hrs) — ₱1,000', 'Paper cups and napkins bundle — ₱300']::text[], NULL, NULL, NULL, '[{"id":"beef-kare-kare","name":"Beef Kare-Kare","category":"Beef","prices":{"Family":1800,"Feast":4200,"XXXL":9500}},{"id":"beef-caldereta","name":"Beef Caldereta","category":"Beef","prices":{"Family":1800,"Feast":4200,"XXXL":9500}},{"id":"crispy-beef-tapa","name":"Crispy Beef Tapa","category":"Beef","prices":{"Family":1700,"Feast":4000,"XXXL":9000}},{"id":"beef-bulalo","name":"Beef Bulalo","category":"Beef","prices":{"Family":1900,"Feast":4400,"XXXL":9800}},{"id":"kinilaw-na-tanigue","name":"Kinilaw na Tanigue","category":"Seafood","prices":{"Family":1900,"Feast":4400,"XXXL":9800}},{"id":"garlic-butter-shrimp","name":"Garlic Butter Shrimp","category":"Seafood","prices":{"Family":2000,"Feast":4600,"XXXL":10200}},{"id":"grilled-bangus-belly","name":"Grilled Bangus Belly","category":"Seafood","prices":{"Family":1700,"Feast":4000,"XXXL":9000}},{"id":"sinigang-na-hipon","name":"Sinigang na Hipon","category":"Seafood","prices":{"Family":1900,"Feast":4400,"XXXL":9800}},{"id":"crispy-pork-sisig","name":"Crispy Pork Sisig","category":"Pork","prices":{"Family":1600,"Feast":3800,"XXXL":8500}},{"id":"bagnet-kare-kare","name":"Bagnet Kare-Kare","category":"Pork","prices":{"Family":1700,"Feast":4000,"XXXL":9000}},{"id":"lechon-kawali","name":"Lechon Kawali","category":"Pork","prices":{"Family":1600,"Feast":3800,"XXXL":8500}},{"id":"pork-binagoongan","name":"Pork Binagoongan","category":"Pork","prices":{"Family":1500,"Feast":3600,"XXXL":8000}},{"id":"chicken-inasal","name":"Chicken Inasal","category":"Chicken","prices":{"Family":1400,"Feast":3200,"XXXL":7200}},{"id":"chicken-adobo-flakes","name":"Chicken Adobo Flakes","category":"Chicken","prices":{"Family":1400,"Feast":3200,"XXXL":7200}},{"id":"buttered-chicken","name":"Buttered Chicken","category":"Chicken","prices":{"Family":1450,"Feast":3300,"XXXL":7400}},{"id":"chicken-pastel","name":"Chicken Pastel","category":"Chicken","prices":{"Family":1450,"Feast":3300,"XXXL":7400}},{"id":"rolled-lasagna","name":"Rolled Lasagna","category":"Pasta","prices":{"Family":1300,"Feast":3000,"XXXL":6800}},{"id":"baked-mac","name":"Baked Mac","category":"Pasta","prices":{"Family":1300,"Feast":3000,"XXXL":6800}},{"id":"filipino-style-spaghetti","name":"Filipino-Style Spaghetti","category":"Pasta","prices":{"Family":1200,"Feast":2800,"XXXL":6300}},{"id":"creamy-carbonara","name":"Creamy Carbonara","category":"Pasta","prices":{"Family":1350,"Feast":3100,"XXXL":7000}},{"id":"leche-flan","name":"Leche Flan","category":"Dessert","prices":{"Family":1100,"Feast":2500,"XXXL":5600}},{"id":"halo-halo","name":"Halo-Halo","category":"Dessert","prices":{"Family":1200,"Feast":2700,"XXXL":6000}},{"id":"turon","name":"Turon","category":"Dessert","prices":{"Family":950,"Feast":2200,"XXXL":4900}},{"id":"buko-pandan-salad","name":"Buko Pandan Salad","category":"Dessert","prices":{"Family":1050,"Feast":2400,"XXXL":5300}},{"id":"garlic-rice","name":"Garlic Rice","category":"Rice","prices":{"Family":900,"Feast":2000,"XXXL":4500}},{"id":"java-rice","name":"Java Rice","category":"Rice","prices":{"Family":950,"Feast":2100,"XXXL":4700}},{"id":"plain-rice","name":"Plain Rice","category":"Rice","prices":{"Family":700,"Feast":1600,"XXXL":3600}},{"id":"bagoong-rice","name":"Bagoong Rice","category":"Rice","prices":{"Family":950,"Feast":2100,"XXXL":4700}}]'::jsonb, NULL),
  ('packed-meals', 'Packed Meals', 'Tray Orders', 'Individually packed Filipino meal boxes, priced per piece — the more you order, the less per piece.', false, '[]'::jsonb, NULL, ARRAY['Individually sealed meal boxes', 'Disposable spoon and fork sets', 'Labeled per dish for easy distribution', 'Free delivery within city limits']::text[], ARRAY['Rush order (within 24 hrs) — ₱1,000', 'Bottled water per box — ₱20/box']::text[], NULL, NULL, NULL, NULL, '[{"category":"Snacks","description":"Salads, wraps, and Filipino snack packs — light meals perfect for casual events.","dishes":["Lumpiang Shanghai","Cheesy Lumpia","Turon","Chicken Empanada","Fishball Skewers","Kwek-Kwek","Siomai","Beef Tapa Wrap"],"tiers":[{"minQty":25,"label":"25+ pcs","pricePerPc":350},{"minQty":50,"label":"50+ pcs","pricePerPc":300},{"minQty":100,"label":"100+ pcs","pricePerPc":250}]},{"category":"Salad / Noodles","description":"Pancit and noodle favorites — pastas come with sourdough artisanal bread.","dishes":["Pancit Canton","Pancit Bihon","Pancit Palabok","Sotanghon Guisado","Filipino-Style Spaghetti","Bam-i","Ensaladang Mangga","Buko Salad"],"tiers":[{"minQty":25,"label":"25+ pcs","pricePerPc":450},{"minQty":50,"label":"50+ pcs","pricePerPc":400},{"minQty":100,"label":"100+ pcs","pricePerPc":350}]},{"category":"Rice Meals","tag":"Best Sellers","description":"Our most popular rice-topping dishes — beef, seafood, pork, and chicken options.","dishes":["Chicken Adobo Rice","Beef Tapa Rice","Pork Sisig Rice","Chicken Inasal Rice","Grilled Bangus Rice","Pork Barbecue Rice","Beef Caldereta Rice","Chicken Curry Rice"],"tiers":[{"minQty":25,"label":"25+ pcs","pricePerPc":325},{"minQty":50,"label":"50+ pcs","pricePerPc":285},{"minQty":100,"label":"100+ pcs","pricePerPc":250}]},{"category":"Premium Rice Meals","description":"Premium beef, seafood, pork, and chicken dishes for a more elevated experience.","dishes":["Lechon Belly Rice","Grilled Salmon Rice","Bistek Tagalog Rice","Garlic Butter Shrimp Rice","Crispy Pata Rice","Herb-Roasted Chicken Rice","Beef Kare-Kare Rice","Salted Egg Crab Rice"],"tiers":[{"minQty":25,"label":"25+ pcs","pricePerPc":850},{"minQty":50,"label":"50+ pcs","pricePerPc":650},{"minQty":100,"label":"100+ pcs","pricePerPc":500}]}]'::jsonb),
  ('grazing-table', 'Grazing Table', 'Grazing', 'A rustic grazing spread of Filipino bite-sized favorites, styled for the table.', false, '[{"pax":50,"paxLabel":"50-100","menus":[{"id":"grazing-table-50","name":"Full Spread","price":20000,"mains":["Embutido Bites","Morcon Slices","Cheesy Lumpia","Korean-Style Fried Chicken Bites","Beef Nachos Bites","Salted Egg Chicken Wings"],"sides":["Buttered Corn","Chicken Macaroni Salad","Fresh Fruit Platter"],"snacks":["Puto","Kutsinta","Mini Empanada"]}]},{"pax":100,"paxLabel":"100-150","menus":[{"id":"grazing-table-100","name":"Full Spread","price":20000,"mains":["Embutido Bites","Morcon Slices","Cheesy Lumpia","Korean-Style Fried Chicken Bites","Beef Nachos Bites","Salted Egg Chicken Wings"],"sides":["Buttered Corn","Chicken Macaroni Salad","Fresh Fruit Platter"],"snacks":["Puto","Kutsinta","Mini Empanada"]}]},{"pax":150,"paxLabel":"150-200","menus":[{"id":"grazing-table-150","name":"Full Spread","price":20000,"mains":["Embutido Bites","Morcon Slices","Cheesy Lumpia","Korean-Style Fried Chicken Bites","Beef Nachos Bites","Salted Egg Chicken Wings"],"sides":["Buttered Corn","Chicken Macaroni Salad","Fresh Fruit Platter"],"snacks":["Puto","Kutsinta","Mini Empanada"]}]}]'::jsonb, '{"mains":["Embutido Bites","Morcon Slices","Cheesy Lumpia","Korean-Style Fried Chicken Bites","Beef Nachos Bites","Salted Egg Chicken Wings"],"sides":["Buttered Corn","Chicken Macaroni Salad","Fresh Fruit Platter"],"snacks":["Puto","Kutsinta","Mini Empanada"]}'::jsonb, ARRAY['2 rustic wooden tables', '1 coffee dispenser', '1 rustic barrel', '2 juice jars', 'Ceramic serving platters and bowls', 'Reusable table runners, greenery, and decorations', 'Disposable plates, cutlery, and paper cups', 'Mugs with logo', '2 serving staff to refill and maintain the spread', '3 hrs of service']::text[], ARRAY['Extra hour of service — ₱1,500/hr', 'Transpo fee — depends on location', 'Service charge — 10%']::text[], NULL, NULL, NULL, NULL, NULL),
  ('grazing-board', 'Grazing Board', 'Grazing', 'Beautifully styled small-format Filipino boards, perfect for intimate spreads.', false, '[{"pax":15,"paxLabel":"15-25","menus":[{"id":"grazing-board-15","name":"Full Spread","price":20000,"mains":["Cured Longganisa Rolls","Baked Cheesy Embutido","Crispy Tadyang Bites","Garlic Parmesan Wings","Smoked Bangus Dip","Chicharon Bulaklak"],"sides":["Mixed Nuts Medley","Toasted Garlic Bread","Berry Buko Salad"],"snacks":["Bibingka","Suman sa Lihiya","Leche Flan Bites"]}]},{"pax":30,"paxLabel":"30-50","menus":[{"id":"grazing-board-30","name":"Full Spread","price":20000,"mains":["Cured Longganisa Rolls","Baked Cheesy Embutido","Crispy Tadyang Bites","Garlic Parmesan Wings","Smoked Bangus Dip","Chicharon Bulaklak"],"sides":["Mixed Nuts Medley","Toasted Garlic Bread","Berry Buko Salad"],"snacks":["Bibingka","Suman sa Lihiya","Leche Flan Bites"]}]},{"pax":60,"paxLabel":"60-100","menus":[{"id":"grazing-board-60","name":"Full Spread","price":20000,"mains":["Cured Longganisa Rolls","Baked Cheesy Embutido","Crispy Tadyang Bites","Garlic Parmesan Wings","Smoked Bangus Dip","Chicharon Bulaklak"],"sides":["Mixed Nuts Medley","Toasted Garlic Bread","Berry Buko Salad"],"snacks":["Bibingka","Suman sa Lihiya","Leche Flan Bites"]}]}]'::jsonb, '{"mains":["Cured Longganisa Rolls","Baked Cheesy Embutido","Crispy Tadyang Bites","Garlic Parmesan Wings","Smoked Bangus Dip","Chicharon Bulaklak"],"sides":["Mixed Nuts Medley","Toasted Garlic Bread","Berry Buko Salad"],"snacks":["Bibingka","Suman sa Lihiya","Leche Flan Bites"]}'::jsonb, ARRAY['1 rustic wooden board barrel', 'Coffee and juice dispensers', 'Ceramic serving platters', 'Disposable paper cups and napkins', 'Decorative styling (florals and greenery)', '1 staff on-site to refill and maintain the board', '3 hrs of service']::text[], ARRAY['Extra hour of service — ₱1,500/hr', 'Transpo fee — depends on location', 'Service charge — 10%']::text[], NULL, NULL, NULL, NULL, NULL),
  ('basic-catering', 'Basic Catering Package', 'Full-Service Catering', 'Simple, satisfying full-buffet service for everyday events. Tables and waiters included.', false, '[]'::jsonb, '{"mains":["Pork Menudo","Beef Mechado","Sweet & Sour Fish Fillet","Chicken Curry","Pork Sinigang","Chicken Afritada"],"sides":["Steamed Garlic Rice","Pancit Bihon","Ensaladang Mangga"],"snacks":["Pandesal Rolls","Soft Drinks","Sago''t Gulaman"]}'::jsonb, ARRAY['8-10 seater round tables with white cover', 'Monoblock chairs with white cover', 'Buffet skirted table set-up', 'Spoon, fork, and dinner plate sets', 'Chafing dishes for all hot food', 'Waiters in uniform', '3-4 hrs of service']::text[], ARRAY['Lechon chopping — ₱2,500 / 2 lechons', 'Service charge — 10%', 'Transpo, hauling, set-up and pull-out — ₱12,000 / 100 pax']::text[], 950, 50, '{"mains":["Pork Menudo","Beef Mechado","Sweet & Sour Fish Fillet","Chicken Curry","Pork Sinigang","Chicken Afritada"],"sides":["Steamed Garlic Rice","Pancit Bihon","Ensaladang Mangga"],"snacks":["Pandesal Rolls","Soft Drinks","Sago''t Gulaman"]}'::jsonb, NULL, NULL),
  ('classic-catering', 'Classic Catering Package', 'Full-Service Catering', 'Premium full service — adds pork dishes, 2 types of dessert, more chafing dishes, and upgraded lights.', true, '[]'::jsonb, '{"mains":["Lechon Belly Roll","Beef Caldereta","Chicken Cordon Bleu","Salted Egg Shrimp","Herb Roasted Beef","Grilled Salmon Steak"],"sides":["Java Rice","Caesar Salad","Buttered Vegetables"],"snacks":["Crema de Fruta","Sparkling Juice","Mini Ensaymada"]}'::jsonb, ARRAY['8-10 seater round tables with white cover', 'Monoblock chairs with white cover', 'Buffet skirted table set-up', 'Dinner plates, saucer, and soup bowl sets', 'Chafing dishes and swan lights', 'Waiters in uniform', 'Color-themed table napkins, ribbons, and centerpiece', '3-4 hrs of service']::text[], ARRAY['Lechon chopping — ₱2,500 / 2 lechons', 'Service charge — 10%', 'Transpo, hauling, set-up and pull-out — ₱12,000 / 100 pax']::text[], 1250, 50, '{"mains":["Lechon Belly Roll","Beef Caldereta","Chicken Cordon Bleu","Salted Egg Shrimp","Herb Roasted Beef","Grilled Salmon Steak"],"sides":["Java Rice","Caesar Salad","Buttered Vegetables"],"snacks":["Crema de Fruta","Sparkling Juice","Mini Ensaymada"]}'::jsonb, NULL, NULL)
on conflict (slug) do nothing;
