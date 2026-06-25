-- ─────────────────────────────────────────────────────────────────────────────
-- products-data-migration.sql
-- Run this in Supabase SQL Editor.
-- Adds a `data jsonb` column to the products table to store the FULL TypeScript
-- Product object. This is the single source of truth used by the app on fetch,
-- so all current and future Product fields (tagline, flavors, weights, gallery,
-- tier, inStock, etc.) persist without further schema migrations.
-- ─────────────────────────────────────────────────────────────────────────────

alter table products add column if not exists data jsonb;

-- Backfill existing rows: wrap current columns into the data jsonb so the app
-- has a complete Product object to read. (Existing rows get their data column
-- populated from whatever standard columns we already have.)
update products
set data = jsonb_build_object(
  'id', id,
  'name', name,
  'description', description,
  'price', price,
  'image', image,
  'rating', rating,
  'reviews', reviews,
  'occasion', category,
  'tagline', name,
  'flavors', '["Chocolate","Vanilla","Strawberry"]'::jsonb,
  'weights', '[{"size":"1 lb","price":0}]'::jsonb,
  'tags', badges,
  'bestseller', false,
  'newArrival', false,
  'tier', 'normal',
  'priceUnit', 'pound',
  'inStock', approved
)
where data is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable Supabase Realtime for the products table so admin edits/deletes push
-- instantly to all connected customer devices. (Safe to re-run.)
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table products;
