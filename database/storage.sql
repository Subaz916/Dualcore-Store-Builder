-- ============================================================
-- DualCore — Storage Buckets
-- Run in Supabase → SQL Editor
-- ============================================================

-- Bucket for published storefronts (public, edge-cached)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('storefronts', 'storefronts', true, 52428800, null)
on conflict (id) do nothing;

-- Bucket for store media (product images, logos, videos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 104857600, null)
on conflict (id) do nothing;

-- Bucket for digital downloads (private by default)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('downloads', 'downloads', false, 524288000, null)
on conflict (id) do nothing;

-- ============================================================
-- Folders are implicit (prefixes). Verify buckets:
--   select * from storage.buckets;
-- ============================================================
