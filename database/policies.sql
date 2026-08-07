-- ============================================================
-- DualCore — Row Level Security Policies
-- Run in Supabase → SQL Editor (AFTER schema.sql + storage.sql)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles          enable row level security;
alter table public.stores            enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.products          enable row level security;
alter table public.categories        enable row level security;
alter table public.collections       enable row level security;
alter table public.collection_products enable row level security;
alter table public.customers         enable row level security;
alter table public.orders            enable row level security;
alter table public.reviews           enable row level security;
alter table public.pages             enable row level security;
alter table public.posts             enable row level security;
alter table public.media             enable row level security;
alter table public.analytics         enable row level security;
alter table public.notifications     enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.cart              enable row level security;
alter table public.wishlist          enable row level security;
alter table public.discounts         enable row level security;
alter table public.shipping          enable row level security;
alter table public.taxes             enable row level security;
alter table public.payments          enable row level security;
alter table public.domains           enable row level security;
alter table public.settings          enable row level security;
alter table public.staff             enable row level security;
alter table public.emails            enable row level security;

-- ============================================================
-- HELPER: rows accessible to the signed-in owner
-- ============================================================

-- ---- PROFILES ----
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- ---- STORES ----
create policy "create own store" on public.stores for insert with check (auth.uid() = user_id);
create policy "read own stores" on public.stores for select using (auth.uid() = user_id);
create policy "update own store" on public.stores for update using (auth.uid() = user_id);
create policy "delete own store" on public.stores for delete using (auth.uid() = user_id);

-- ---- SUBSCRIPTIONS ----
create policy "insert own sub" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "read own sub" on public.subscriptions for select using (auth.uid() = user_id);
create policy "update own sub" on public.subscriptions for update using (auth.uid() = user_id);

-- ---- PRODUCTS ----
create policy "insert own product" on public.products for insert with check (auth.uid() = user_id);
create policy "read own products" on public.products for select using (auth.uid() = user_id);
create policy "update own product" on public.products for update using (auth.uid() = user_id);
create policy "delete own product" on public.products for delete using (auth.uid() = user_id);

-- ---- CATEGORIES & COLLECTIONS ----
create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own collections" on public.collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own collection_products" on public.collection_products
  for all using (
    exists (select 1 from public.collections c where c.id = collection_products.collection_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.collections c where c.id = collection_products.collection_id and c.user_id = auth.uid())
  );

-- ---- CUSTOMERS ----
create policy "own customers" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ORDERS ----
create policy "own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- REVIEWS ----
create policy "read approved reviews (public)" on public.reviews
  for select using (approved = true or auth.uid() = user_id);
create policy "insert review" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "update own review" on public.reviews
  for update using (auth.uid() = user_id or exists (select 1 from public.products p where p.id = reviews.product_id and p.user_id = auth.uid()));

-- ---- PAGES / POSTS ----
create policy "own pages" on public.pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own posts" on public.posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- MEDIA ----
create policy "own media" on public.media
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ANALYTICS ----
create policy "owner writes analytics" on public.analytics
  for insert with check (auth.uid() = user_id);
create policy "owner reads analytics" on public.analytics
  for select using (auth.uid() = user_id);

-- ---- NOTIFICATIONS ----
create policy "own notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ACTIVITY LOG ----
create policy "own activity" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- CART (own + guest session) ----
create policy "cart all access" on public.cart
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- WISHLIST ----
create policy "own wishlist" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- DISCOUNTS ----
create policy "own discounts" on public.discounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- SHIPPING ----
create policy "own shipping rules" on public.shipping
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- TAXES ----
create policy "own taxes" on public.taxes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- PAYMENTS ----
create policy "own payments" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- DOMAINS ----
create policy "own domains" on public.domains
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- SETTINGS ----
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- STAFF ----
create policy "owner manages staff" on public.staff
  for all using (
    exists (select 1 from public.stores s where s.id = staff.store_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.stores s where s.id = staff.store_id and s.user_id = auth.uid())
  );

-- ---- EMAILS ----
create policy "own emails" on public.emails
  for select using (auth.uid() = user_id);

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- storefronts bucket: public read, owner upload/delete
create policy "storefronts public read"
  on storage.objects for select
  using (bucket_id = 'storefronts');

create policy "storefronts owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'storefronts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storefronts owner update"
  on storage.objects for update
  using (
    bucket_id = 'storefronts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storefronts owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'storefronts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- media bucket: public read, owner upload inside own folder
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media' or bucket_id = 'downloads');

create policy "media owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'media' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'media' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- NOTE
--  For storefronts bucket, publish.js uploads to:
--    storefronts/<user_id>/<slug>/...
--  (toggle the flag in publish.js if you'd rather use the slug.)
-- ============================================================