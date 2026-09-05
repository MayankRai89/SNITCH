-- Migration: 002_create_sellers_table.sql
-- Purpose: comprehensive seller onboarding, multi-document verification,
-- compliance audit trail, pause/resume state, and soft deletion.

-- ─────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────

create type business_type as enum ('individual', 'business');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type payout_method as enum ('bank', 'upi');
create type document_type as enum (
  'id_proof',              -- Aadhaar / Passport / Voter ID
  'business_registration', -- Incorporation Certificate / MSME / Shop Act
  'tax_certificate',       -- GST Certificate / PAN Card
  'cancelled_cheque',      -- Bank Account Proof
  'other'
);

-- ─────────────────────────────────────────────
-- 2. sellers table
-- ─────────────────────────────────────────────

create table sellers (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references users(id) on delete cascade,

  -- Wizard state (allows seamless resume if abandoned)
  onboarding_step        smallint not null default 1,     -- 1: Identity, 2: Address, 3: Compliance & Tax, 4: Payout, 5: Presentation

  -- Store identity
  store_name             text not null,
  store_slug             text not null unique,
  business_type          business_type not null default 'individual',
  contact_phone          text not null,
  address_line1          text not null,
  address_line2          text,
  city                   text not null,
  state                  text not null,
  postal_code            text not null,
  country                text not null default 'IN',

  -- Verification & compliance
  tax_id                 text,                            -- GSTIN or PAN
  verification_status    verification_status not null default 'pending',
  rejected_reason        text,                            -- Seller-facing reason if rejected
  verification_notes     text,                            -- Internal admin-only review notes
  approved_at            timestamptz,                     -- Audit: when approved
  approved_by            uuid references users(id),       -- Audit: admin user who approved
  agreed_to_terms_at     timestamptz,

  -- Payout linkage (processor reference IDs, zero raw banking data)
  payout_method          payout_method,
  payout_reference_id    text,
  payout_display_hint    text,                            -- e.g. "UPI ••••7788" or "A/C ••••4421"
  payout_verified        boolean not null default false,

  -- Store presentation
  bio                    text,
  logo_url               text,
  banner_url             text,
  return_policy          text,

  -- Operational controls & soft delete
  is_active              boolean not null default true,   -- Storefront pause/unpause without losing verification
  deleted_at             timestamptz,                     -- Soft deletion preserves order history integrity

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint store_slug_format check (store_slug ~ '^[a-z0-9-]+$'),
  constraint one_seller_profile_per_user unique (user_id)
);

-- ─────────────────────────────────────────────
-- 3. seller_documents table (Multi-doc support)
-- ─────────────────────────────────────────────

create table seller_documents (
  id                     uuid primary key default gen_random_uuid(),
  seller_id              uuid not null references sellers(id) on delete cascade,
  doc_type               document_type not null,
  file_url               text not null,                   -- Path in private Supabase Storage bucket
  file_name              text,
  status                 verification_status not null default 'pending',
  rejection_reason       text,
  reviewed_at            timestamptz,
  reviewed_by            uuid references users(id),
  uploaded_at            timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 4. seller_verification_history (Audit Trail)
-- ─────────────────────────────────────────────

create table seller_verification_history (
  id                     uuid primary key default gen_random_uuid(),
  seller_id              uuid not null references sellers(id) on delete cascade,
  from_status            verification_status,
  to_status              verification_status not null,
  changed_by             uuid references users(id),
  reason                 text,
  created_at             timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 5. Indexes
-- ─────────────────────────────────────────────

create index idx_sellers_user_id on sellers(user_id);
create index idx_sellers_verification_status on sellers(verification_status);
create index idx_sellers_is_active on sellers(is_active) where is_active = true and deleted_at is null;
create unique index idx_sellers_store_slug on sellers(store_slug);

create index idx_seller_documents_seller_id on seller_documents(seller_id);
create index idx_seller_verification_history_seller on seller_verification_history(seller_id);

-- ─────────────────────────────────────────────
-- 6. Trigger: automatic updated_at
-- ─────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sellers_set_updated_at
  before update on sellers
  for each row
  execute function set_updated_at();

create trigger seller_documents_set_updated_at
  before update on seller_documents
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────
-- 7. Trigger: only 'seller'-role users may have a seller profile
-- ─────────────────────────────────────────────

create or replace function check_user_is_seller()
returns trigger as $$
begin
  if not exists (
    select 1 from users where id = new.user_id and role = 'seller'
  ) then
    raise exception 'User % does not have seller role', new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger sellers_require_seller_role
  before insert on sellers
  for each row
  execute function check_user_is_seller();

-- ─────────────────────────────────────────────
-- 8. Row Level Security
-- ─────────────────────────────────────────────

alter table sellers enable row level security;
alter table seller_documents enable row level security;
alter table seller_verification_history enable row level security;

-- SELLERS:
-- Public can view active, non-deleted storefronts for verified sellers
create policy "Public can view verified seller storefronts"
  on sellers for select
  using (verification_status = 'verified' and is_active = true and deleted_at is null);

-- A seller can view their own profile (even if pending or paused)
create policy "Sellers can view their own profile"
  on sellers for select
  using (auth.uid() = user_id and deleted_at is null);

-- A seller can insert their profile
create policy "Users can create their own seller profile"
  on sellers for insert
  with check (auth.uid() = user_id);

-- A seller can update their profile
create policy "Sellers can update their own profile"
  on sellers for update
  using (auth.uid() = user_id and deleted_at is null);

-- SELLER DOCUMENTS:
-- Seller can view their own uploaded documents
create policy "Sellers can view their own documents"
  on seller_documents for select
  using (
    exists (
      select 1 from sellers where sellers.id = seller_documents.seller_id and sellers.user_id = auth.uid()
    )
  );

-- Seller can upload documents
create policy "Sellers can insert their documents"
  on seller_documents for insert
  with check (
    exists (
      select 1 from sellers where sellers.id = seller_documents.seller_id and sellers.user_id = auth.uid()
    )
  );

-- VERIFICATION HISTORY:
-- Seller can view their audit history
create policy "Sellers can view their verification history"
  on seller_verification_history for select
  using (
    exists (
      select 1 from sellers where sellers.id = seller_verification_history.seller_id and sellers.user_id = auth.uid()
    )
  );
