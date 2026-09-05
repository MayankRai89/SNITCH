-- Migration: 010_create_cart_items_table.sql
-- Purpose: Create cart_items table for logged-in user cart synchronization.
-- Access control is handled by Express JWT middleware.

create table if not exists cart_items (
  id                  uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  product_id          uuid not null references products(id) on delete cascade,
  selected_size       text not null default 'M',
  selected_color      text not null default 'Standard',
  quantity            integer not null default 1 check (quantity > 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint unique_user_cart_item unique (user_id, product_id, selected_size, selected_color)
);

-- Indexes
create index if not exists idx_cart_items_user_id on cart_items(user_id);
create index if not exists idx_cart_items_product_id on cart_items(product_id);

-- updated_at trigger (if set_updated_at exists)
do $$ begin
  create trigger cart_items_set_updated_at
    before update on cart_items
    for each row execute function set_updated_at();
exception when others then null; end $$;

-- Disable RLS since backend uses custom JWT auth with Express middleware
alter table cart_items disable row level security;
