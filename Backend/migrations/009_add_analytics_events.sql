-- Migration: 009_add_analytics_events.sql
-- Purpose: Lightweight seller analytics event tracking.
-- (Idempotent — safe to re-run)

-- ─────────────────────────────────────────────
-- 1. seller_events table
-- ─────────────────────────────────────────────

create table if not exists seller_events (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  event_type  text not null,           -- 'product_view' | 'add_to_cart' | 'order_placed' | 'order_cancelled'
  revenue     numeric(12, 2),          -- populated for order_placed events
  metadata    jsonb,                   -- flexible extra context
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. Indexes (time-series queries)
-- ─────────────────────────────────────────────

create index if not exists idx_seller_events_seller    on seller_events(seller_id, created_at desc);
create index if not exists idx_seller_events_type      on seller_events(seller_id, event_type);
create index if not exists idx_seller_events_product   on seller_events(product_id);

-- ─────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────

alter table seller_events enable row level security;

-- Sellers see only their own events
drop policy if exists "Sellers see own events" on seller_events;
create policy "Sellers see own events"
  on seller_events for select
  using (
    exists (
      select 1 from sellers
      where sellers.id = seller_events.seller_id
        and sellers.user_id = auth.uid()
        and sellers.deleted_at is null
    )
  );

-- Only backend service role can insert (no direct client writes)
