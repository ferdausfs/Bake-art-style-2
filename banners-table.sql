-- banners-table.sql
-- Run this migration after admin-rls-fix.sql

-- NOTE: A 'banner-images' storage bucket needs to exist in Supabase Storage with public access, similar to 'product-images' bucket.
-- You can create it in the Supabase Dashboard under Storage -> New Bucket (Name: banner-images, Public: true).

create table if not exists banners (
  id text primary key,
  title text not null,
  subtitle text not null,
  image text not null,
  tag text not null,
  color text not null,
  type text not null default 'new_item',
  promo_code text,
  product_id text,
  notice_text text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table banners enable row level security;

-- Drop existing policies if any
drop policy if exists "Public read banners" on banners;
drop policy if exists "Admin manage banners" on banners;

create policy "Public read banners" on banners for select to anon, authenticated using (true);
create policy "Admin manage banners" on banners for all using (is_admin_user());
