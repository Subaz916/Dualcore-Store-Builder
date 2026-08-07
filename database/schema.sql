-- ============================================================
-- DualCore Store Builder — Database Schema (PostgreSQL / Supabase)
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS & PROFILES
-- ============================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text default 'Store Owner',
  email         text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- STORES
-- ============================================================

create table if not exists public.stores (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null default 'My Store',
  slug           text unique not null,
  tagline        text default '',
  description    text,
  logo_url       text,
  favicon_url    text,
  announcement   text default '',
  theme          text default 'minimal',
  theme_color    text default '#5C6EFF',
  theme_soft     text default '#EFF1FF',
  theme_font     text default 'Inter',
  theme_radius   int default 16,
  custom_domain  text,
  plan           text default 'free',
  status         text default 'draft',              -- draft | published | suspended
  published_at   timestamptz,
  meta_title     text,
  meta_desc      text,
  meta_keywords  text[],
  analytics_id   text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists idx_stores_user on public.stores(user_id);
create index if not exists idx_stores_slug on public.stores(slug);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table if not exists public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan           text not null default 'free',     -- free | basic | premium
  status         text not null default 'active',   -- active | past_due | cancelled | expired
  start_date     timestamptz default now(),
  end_date       timestamptz,
  renewal        text default 'none',              -- none | monthly | yearly
  payment_method text default 'none',              -- card | cod | razorpay | none
  price          numeric default 0,
  currency       text default 'PKR',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists idx_sub_user on public.subscriptions(user_id);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  slug          text,
  description   text,
  price         numeric not null default 0,
  compare_at    numeric,
  cost          numeric,
  sku           text,
  barcode       text,
  category      text,
  tags          text[] default '{}',
  type          text default 'physical',            -- physical | digital | service
  status        text default 'active',              -- active | draft | archived
  featured      boolean default false,
  images        text[] default '{}',                -- public urls
  variants      jsonb default '[]',                 -- [{name,color,size,price,stock}]
  inventory     int default 0,
  track_stock   boolean default true,
  weight        numeric,
  shipping      jsonb default '{}',
  digital_file  text,
  seo_title     text,
  seo_desc      text,
  rating        numeric default 0,
  rating_count  int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_products_user on public.products(user_id);
create index if not exists idx_products_cat on public.products(category);
create index if not exists idx_products_featured on public.products(featured);

-- ============================================================
-- CATEGORIES & COLLECTIONS
-- ============================================================

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  slug       text,
  image      text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  slug       text,
  description text,
  image      text,
  rules      jsonb default '{}',      -- automated collection rules
  created_at timestamptz default now()
);

create table if not exists public.collection_products (
  collection_id uuid references public.collections(id) on delete cascade,
  product_id    uuid references public.products(id) on delete cascade,
  primary key (collection_id, product_id)
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  address       text,
  city          text,
  country       text default 'Pakistan',
  orders_count  int default 0,
  total_spent   numeric default 0,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, email)
);

-- ============================================================
-- ORDERS
-- ============================================================

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  customer_name  text not null,
  customer_email text,
  phone          text,
  address        text,
  city           text,
  country        text,
  items          jsonb default '[]',       -- [{product_id,name,price,qty,variant}]
  subtotal       numeric default 0,
  discount       numeric default 0,
  shipping       numeric default 0,
  tax            numeric default 0,
  total          numeric default 0,
  currency       text default 'PKR',
  status         text default 'pending',   -- pending | paid | shipped | delivered | cancelled | refunded
  payment_method text,
  tracking_code  text,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- ============================================================
-- REVIEWS
-- ============================================================

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  name       text,
  rating     int not null check (rating between 1 and 5),
  title      text,
  body       text,
  approved   boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- PAGES & BLOGS
-- ============================================================

create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  title       text,
  content     jsonb default '[]',        -- builder sections
  meta_title  text,
  meta_desc   text,
  published   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, slug)
);

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  slug        text,
  excerpt     text,
  content     text,
  cover       text,
  tags        text[] default '{}',
  published   boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- MEDIA
-- ============================================================

create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  path        text,                      -- storage path
  url         text,
  type        text default 'image',      -- image | video | svg | file | icon
  size        bigint,
  folder      text default 'all',
  created_at  timestamptz default now()
);

-- ============================================================
-- ANALYTICS
-- ============================================================

create table if not exists public.analytics (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete cascade,
  event       text not null,             -- pageview | add_to_cart | checkout | purchase
  url         text,
  referrer    text,
  device      text,
  country     text,
  meta        jsonb default '{}',
  created_at  timestamptz default now()
);

create index if not exists idx_analytics_user on public.analytics(user_id, created_at desc);

-- ============================================================
-- NOTIFICATIONS & ACTIVITY LOG
-- ============================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text default 'info',       -- order | store | billing | tip
  title       text not null,
  body        text,
  read        boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.activity_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  action     text not null,
  entity     text,
  entity_id  text,
  meta       jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- CART / WISHLIST / DISCOUNTS / SHIPPING / TAXES
-- ============================================================

create table if not exists public.cart (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  session_id text,
  product_id uuid references public.products(id) on delete cascade,
  qty        int default 1,
  variant    jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.wishlist (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

create table if not exists public.discounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null,
  type        text default 'percent',    -- percent | fixed
  value       numeric not null default 0,
  min_order   numeric default 0,
  usage_limit int default 0,
  used        int default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  active      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists public.shipping (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  price       numeric default 0,
  regions     text[] default '{}',
  min_order   numeric default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists public.taxes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  country    text default 'Pakistan',
  rate       numeric default 0,
  active     boolean default true
);

-- ============================================================
-- PAYMENTS / DOMAINS / SETTINGS / STAFF / EMAILS
-- ============================================================

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  order_id      uuid references public.orders(id) on delete set null,
  amount        numeric not null,
  currency      text default 'PKR',
  method        text,                  -- card | cod | razorpay | easypaisa | jazzcash
  status        text default 'pending',
  transaction_id text,
  receipt_url   text,
  created_at    timestamptz default now()
);

create table if not exists public.domains (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  domain      text not null unique,
  store_id    uuid references public.stores(id) on delete cascade,
  verified    boolean default false,
  ssl_status  text default 'pending',   -- pending | active | failed
  created_at  timestamptz default now()
);

create table if not exists public.settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete cascade,
  locale      text default 'en',
  currency    text default 'PKR',
  timezone    text default 'Asia/Karachi',
  dark_mode   boolean default false,
  email_notifications jsonb default '{"orders":true,"marketing":true,"tips":true}',
  updated_at  timestamptz default now()
);

create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text default 'editor',    -- owner | editor | viewer
  permissions text[] default '{}',
  invited_at  timestamptz default now()
);

create table if not exists public.emails (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  to_email    text not null,
  subject     text,
  body        text,
  type        text,                    -- order | marketing | reset | verify
  status      text default 'queued',   -- queued | sent | failed
  sent_at     timestamptz
);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at helper
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_stores_updated before update on public.stores
  for each row execute function public.set_updated_at();
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: seed subscription + settings on first store
-- ============================================================

create or replace function public.handle_new_store()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status, start_date, end_date, renewal)
  values (
    new.user_id, 'free', 'active', now(),
    now() + interval '3 days', 'none'
  )
  on conflict do nothing;

  insert into public.settings (user_id, store_id)
  values (new.user_id, new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_store_created on public.stores;
create trigger on_store_created
  after insert on public.stores
  for each row execute procedure public.handle_new_store();

-- ============================================================
-- GRANTS (safe defaults; policies govern access)
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
