-- ─── Products ──────────────────────────────────────────────
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null default 'birthday',
  price integer not null default 0,
  rating numeric(2,1) not null default 4.5,
  reviews integer not null default 0,
  tag text,
  weight text not null default '১ কেজি',
  image text,
  description text,
  approved boolean not null default true,
  badges text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── Orders ────────────────────────────────────────────────
create table if not exists orders (
  id text primary key,
  user_id uuid references auth.users(id),
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  delivery_date text not null,
  delivery_time text not null,
  payment_method text not null default 'cod',
  payment_screenshot text,
  items jsonb not null default '[]',
  subtotal integer not null default 0,
  discount integer not null default 0,
  delivery_fee integer not null default 60,
  total integer not null default 0,
  status text not null default 'pending',
  promo_code text,
  created_at timestamptz not null default now()
);

-- ─── Gallery ────────────────────────────────────────────────
create table if not exists gallery_items (
  id text primary key,
  image text not null,
  caption text,
  product_id text references products(id),
  created_at timestamptz not null default now()
);

-- ─── Reviews ────────────────────────────────────────────────
create table if not exists reviews (
  id text primary key,
  product_id text not null references products(id),
  user_id uuid references auth.users(id),
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Profiles ───────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  name text,
  contact text,
  created_at timestamptz not null default now()
);

-- ─── RLS Policies ───────────────────────────────────────────
alter table products enable row level security;
alter table orders enable row level security;
alter table gallery_items enable row level security;
alter table reviews enable row level security;
alter table profiles enable row level security;

create policy "Public read approved products" on products for select using (approved = true);
create policy "Admin manage products" on products for all using (auth.role() = 'authenticated');

create policy "Anyone place order" on orders for insert with check (true);
create policy "Users read own orders" on orders for select using (auth.uid() = user_id or auth.role() = 'authenticated');
create policy "Admin update orders" on orders for update using (auth.role() = 'authenticated');

create policy "Public read gallery" on gallery_items for select using (true);
create policy "Admin manage gallery" on gallery_items for all using (auth.role() = 'authenticated');

create policy "Public read approved reviews" on reviews for select using (approved = true);
create policy "Auth insert review" on reviews for insert with check (auth.uid() = user_id);
create policy "Admin manage reviews" on reviews for all using (auth.role() = 'authenticated');

create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for all using (auth.uid() = id);

-- ─── Storage ────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true) on conflict do nothing;

create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Auth upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "Auth upload payment screenshots" on storage.objects for insert with check (bucket_id = 'payment-screenshots');
create policy "Admin read payment screenshots" on storage.objects for select using (bucket_id = 'payment-screenshots' and auth.role() = 'authenticated');
create policy "Public read gallery images" on storage.objects for select using (bucket_id = 'gallery');
create policy "Auth upload gallery images" on storage.objects for insert with check (bucket_id = 'gallery');

-- ─── App Settings (Location / Delivery Zone feature) ─────────
create table if not exists app_settings (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into app_settings (key, value) values
  ('whatsapp_number', '"8801XXXXXXXXX"'),
  ('allowed_districts', '["কুমিল্লা"]'),
  ('delivery_zones_enabled', 'true'),
  ('out_of_zone_message', '"আমরা এখনো আপনার এলাকায় ডেলিভারি দিচ্ছি না। অর্ডার করতে WhatsApp এ যোগাযোগ করুন।"')
on conflict (key) do nothing;

alter table orders
  add column if not exists district text,
  add column if not exists gps_lat double precision,
  add column if not exists gps_lng double precision,
  add column if not exists location_address text,
  add column if not exists location_verified boolean default false;

create index if not exists idx_orders_district on orders(district);
create index if not exists idx_orders_created_at on orders(created_at desc);

alter table app_settings enable row level security;

create policy "Public read settings" on app_settings for select to anon, authenticated using (true);
create policy "Admin update settings" on app_settings for all to authenticated using (true) with check (true);

create or replace function update_app_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_settings_updated_at
  before update on app_settings
  for each row execute function update_app_settings_updated_at();


-- Enable realtime INSERT/UPDATE events for admin order notifications.
-- If this says already added, ignore.
alter publication supabase_realtime add table orders;
