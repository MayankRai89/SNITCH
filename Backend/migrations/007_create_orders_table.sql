-- Migration: 007_create_orders_table.sql
-- Purpose: Full order lifecycle management with buyer/seller views and RLS.
-- (Idempotent — safe to re-run)

-- ─────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────

do $$ begin
  create type order_status as enum (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cod', 'card', 'upi', 'netbanking');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- 2. orders table
-- ─────────────────────────────────────────────

create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  buyer_id            uuid not null references users(id) on delete restrict,
  seller_id           uuid not null references sellers(id) on delete restrict,

  -- Financials (server-computed, never client-trusted)
  subtotal            numeric(12, 2) not null check (subtotal >= 0),
  discount_amount     numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total               numeric(12, 2) not null check (total >= 0),
  coupon_code         text,

  -- Fulfillment
  status              order_status not null default 'pending',
  payment_method      text not null default 'cod',
  payment_status      payment_status not null default 'pending',

  -- Shipping (stored as snapshot so address changes don't affect old orders)
  shipping_name       text not null,
  shipping_phone      text not null,
  shipping_line1      text not null,
  shipping_line2      text,
  shipping_city       text not null,
  shipping_state      text not null,
  shipping_postal     text not null,
  shipping_country    text not null default 'IN',

  -- Audit
  confirmed_at        timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  cancel_reason       text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. order_items table (line items snapshot)
-- ─────────────────────────────────────────────

create table if not exists order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  product_id          uuid not null references products(id) on delete restrict,

  -- Snapshot at time of order (so edits to product don't change historical orders)
  title               text not null,
  sku                 text,
  selected_size       text,
  selected_color      text,
  quantity            integer not null check (quantity > 0),
  unit_price          numeric(10, 2) not null check (unit_price >= 0),
  compare_at_price    numeric(10, 2),
  cover_image_url     text,

  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────

create index if not exists idx_orders_buyer_id   on orders(buyer_id);
create index if not exists idx_orders_seller_id  on orders(seller_id);
create index if not exists idx_orders_status     on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_prod  on order_items(product_id);

-- ─────────────────────────────────────────────
-- 5. updated_at trigger
-- ─────────────────────────────────────────────

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────

alter table orders      enable row level security;
alter table order_items enable row level security;

-- Buyers see only their own orders
drop policy if exists "Buyers see own orders" on orders;
create policy "Buyers see own orders"
  on orders for select
  using (buyer_id = auth.uid());

-- Sellers see orders that belong to their store
drop policy if exists "Sellers see their store orders" on orders;
create policy "Sellers see their store orders"
  on orders for select
  using (
    exists (
      select 1 from sellers
      where sellers.id = orders.seller_id
        and sellers.user_id = auth.uid()
        and sellers.deleted_at is null
    )
  );

-- Only the backend service role can insert/update orders (no direct client writes)
-- (The backend uses the service-role key which bypasses RLS)

-- order_items follow their parent order visibility
drop policy if exists "Buyers see own order items" on order_items;
create policy "Buyers see own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.buyer_id = auth.uid()
    )
  );

drop policy if exists "Sellers see their order items" on order_items;
create policy "Sellers see their order items"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      join sellers s on s.id = o.seller_id
      where o.id = order_items.order_id
        and s.user_id = auth.uid()
        and s.deleted_at is null
    )
  );
