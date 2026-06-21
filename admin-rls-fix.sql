-- admin-rls-fix.sql
-- NOTE: app-settings-rls-fix.sql and banners-table.sql must be run after this file
-- Run this migration after supabase-schema.sql and repair-orders-table.sql

-- 1. Add is_admin column to profiles if it doesn't exist
alter table profiles add column if not exists is_admin boolean not null default false;

-- 2. Set is_admin = true for the row where auth.users.email = 'umuhammadiswa@gmail.com'
update profiles
set is_admin = true
where id in (
  select id from auth.users where email = 'umuhammadiswa@gmail.com'
);

-- 3. Create or replace the admin check helper function
create or replace function is_admin_user()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- 4. Recreate Admin Policies with is_admin_user() check

-- Products
drop policy if exists "Admin manage products" on products;
create policy "Admin manage products" on products for all using (is_admin_user());

-- Orders: Users read own orders (or admin read all orders)
drop policy if exists "Users read own orders" on orders;
create policy "Users read own orders" on orders for select using (auth.uid() = user_id or is_admin_user());

-- Orders: Admin update orders
drop policy if exists "Admin update orders" on orders;
create policy "Admin update orders" on orders for update using (is_admin_user());

-- Gallery
drop policy if exists "Admin manage gallery" on gallery_items;
create policy "Admin manage gallery" on gallery_items for all using (is_admin_user());

-- Reviews
drop policy if exists "Admin manage reviews" on reviews;
create policy "Admin manage reviews" on reviews for all using (is_admin_user());

-- App Settings
drop policy if exists "Admin update settings" on app_settings;
create policy "Admin update settings" on app_settings for all using (is_admin_user());
