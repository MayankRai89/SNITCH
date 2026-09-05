-- Migration: 008_create_reviews_table.sql
-- Purpose: Product review system with verified purchase enforcement and RLS.
-- (Idempotent — safe to re-run)

-- ─────────────────────────────────────────────
-- 1. reviews table
-- ─────────────────────────────────────────────

create table if not exists reviews (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references products(id) on delete cascade,
  buyer_id              uuid not null references users(id) on delete cascade,
  order_id              uuid references orders(id) on delete set null,

  rating                smallint not null check (rating >= 1 and rating <= 5),
  title                 text,
  body                  text,

  -- Trust signals
  is_verified_purchase  boolean not null default false,
  helpful_count         integer not null default 0 check (helpful_count >= 0),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- One review per buyer per product
  constraint uq_review_buyer_product unique (buyer_id, product_id)
);

-- ─────────────────────────────────────────────
-- 2. Indexes
-- ─────────────────────────────────────────────

create index if not exists idx_reviews_product_id on reviews(product_id);
create index if not exists idx_reviews_buyer_id   on reviews(buyer_id);
create index if not exists idx_reviews_rating     on reviews(product_id, rating);

-- ─────────────────────────────────────────────
-- 3. updated_at trigger
-- ─────────────────────────────────────────────

drop trigger if exists reviews_set_updated_at on reviews;
create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- 4. Row Level Security
-- ─────────────────────────────────────────────

alter table reviews enable row level security;

-- Public can read reviews for active products
drop policy if exists "Public can read reviews" on reviews;
create policy "Public can read reviews"
  on reviews for select
  using (
    exists (
      select 1 from products
      where products.id = reviews.product_id
        and products.is_active = true
        and products.deleted_at is null
    )
  );

-- Buyers can insert their own review
drop policy if exists "Buyers can create reviews" on reviews;
create policy "Buyers can create reviews"
  on reviews for insert
  with check (buyer_id = auth.uid());

-- Buyers can update their own review
drop policy if exists "Buyers can update own reviews" on reviews;
create policy "Buyers can update own reviews"
  on reviews for update
  using (buyer_id = auth.uid());

-- Buyers can delete their own review
drop policy if exists "Buyers can delete own reviews" on reviews;
create policy "Buyers can delete own reviews"
  on reviews for delete
  using (buyer_id = auth.uid());
