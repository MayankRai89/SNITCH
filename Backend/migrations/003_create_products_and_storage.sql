-- Migration: 003_create_products_and_storage.sql
-- Purpose: Product catalog management with multi-image gallery support and Supabase Storage bucket setup.
-- (100% Idempotent — safe to re-run multiple times)

-- ─────────────────────────────────────────────
-- 1. products table
-- ─────────────────────────────────────────────

create table if not exists products (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references sellers(id) on delete cascade,

  -- Product details
  title               text not null,
  slug                text not null unique,
  description         text,
  category            text not null,             -- 'men', 'women', 'streetwear', 'accessories', etc.
  
  -- Pricing & Inventory
  price               numeric(10, 2) not null check (price >= 0),
  compare_at_price    numeric(10, 2) check (compare_at_price is null or compare_at_price >= price),
  stock               integer not null default 0 check (stock >= 0),
  sku                 text,

  -- Variants & Attributes
  sizes               text[] default '{}',       -- e.g. ['S', 'M', 'L', 'XL', 'XXL']
  colors              text[] default '{}',       -- e.g. ['Obsidian Black', 'Acid Wash Grey']
  tags                text[] default '{}',       -- e.g. ['NEW DROP', 'BESTSELLER', 'LIMITED']

  -- Images (Supabase Storage URLs)
  cover_image_url     text not null,             -- Primary thumbnail/card view
  images              text[] not null default '{}', -- Gallery array of high-res image URLs

  -- Status & Soft Delete
  is_active           boolean not null default true,
  deleted_at          timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint product_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- ─────────────────────────────────────────────
-- 2. Indexes (with IF NOT EXISTS)
-- ─────────────────────────────────────────────

create index if not exists idx_products_seller_id on products(seller_id);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_is_active on products(is_active) where is_active = true and deleted_at is null;
create unique index if not exists idx_products_slug on products(slug);

-- ─────────────────────────────────────────────
-- 3. Trigger for updated_at
-- ─────────────────────────────────────────────

drop trigger if exists products_set_updated_at on products;

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────
-- 4. Row Level Security Policies
-- ─────────────────────────────────────────────

alter table products enable row level security;

-- Public can view active products from active & verified sellers
drop policy if exists "Public can view active products" on products;
create policy "Public can view active products"
  on products for select
  using (
    is_active = true
    and deleted_at is null
    and exists (
      select 1 from sellers
      where sellers.id = products.seller_id
        and sellers.verification_status = 'verified'
        and sellers.is_active = true
        and sellers.deleted_at is null
    )
  );

-- Sellers can view all their own products (including inactive/drafts)
drop policy if exists "Sellers can view their own products" on products;
create policy "Sellers can view their own products"
  on products for select
  using (
    exists (
      select 1 from sellers
      where sellers.id = products.seller_id
        and sellers.user_id = auth.uid()
        and sellers.deleted_at is null
    )
  );

-- Sellers can insert their own products
drop policy if exists "Sellers can create products" on products;
create policy "Sellers can create products"
  on products for insert
  with check (
    exists (
      select 1 from sellers
      where sellers.id = products.seller_id
        and sellers.user_id = auth.uid()
        and sellers.deleted_at is null
    )
  );

-- Sellers can update their own products
drop policy if exists "Sellers can update their own products" on products;
create policy "Sellers can update their own products"
  on products for update
  using (
    exists (
      select 1 from sellers
      where sellers.id = products.seller_id
        and sellers.user_id = auth.uid()
        and sellers.deleted_at is null
    )
  );

-- Sellers can delete their own products
drop policy if exists "Sellers can delete their own products" on products;
create policy "Sellers can delete their own products"
  on products for delete
  using (
    exists (
      select 1 from sellers
      where sellers.id = products.seller_id
        and sellers.user_id = auth.uid()
        and sellers.deleted_at is null
    )
  );

-- ─────────────────────────────────────────────
-- 5. Supabase Storage: 'products' Bucket Setup
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- Allow public read access to product images
drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select
  using (bucket_id = 'products');

-- Allow authenticated users to upload product images
drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');

-- Allow users to update/delete their own uploaded images
drop policy if exists "Users can update their product images" on storage.objects;
create policy "Users can update their product images"
  on storage.objects for update
  using (bucket_id = 'products' and auth.uid() = owner);

drop policy if exists "Users can delete their product images" on storage.objects;
create policy "Users can delete their product images"
  on storage.objects for delete
  using (bucket_id = 'products' and auth.uid() = owner);
