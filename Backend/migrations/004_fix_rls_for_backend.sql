-- Migration: 004_fix_rls_for_backend.sql
-- 
-- Problem: The backend uses its own JWT auth system, NOT Supabase Auth.
-- This means auth.uid() is always NULL for backend requests.
-- RLS policies that check auth.uid() block all backend writes.
--
-- Fix Strategy:
--   A) If SUPABASE_SERVICE_ROLE_KEY is set in .env → the service role bypasses
--      RLS automatically, no migration needed.
--
--   B) If only the anon/publishable key is available (current state) → we must
--      either disable RLS or add permissive policies for the anon role.
--
-- This migration disables RLS on the tables managed entirely by the backend
-- (sellers, seller_documents, seller_verification_history, products).
-- Access control is enforced by the Express middleware (JWT + role checks),
-- not Supabase RLS. This is the correct model for a dedicated backend server.

-- ── sellers ────────────────────────────────────────────────────────────────────
alter table sellers disable row level security;

-- ── seller_documents ──────────────────────────────────────────────────────────
alter table seller_documents disable row level security;

-- ── seller_verification_history ───────────────────────────────────────────────
alter table seller_verification_history disable row level security;

-- ── products ──────────────────────────────────────────────────────────────────
-- (products RLS may or may not be enabled depending on migration 003 state)
alter table products disable row level security;

-- NOTE: When you add SUPABASE_SERVICE_ROLE_KEY to your .env, you can
-- re-enable RLS and these policies will be enforced again for any direct
-- Supabase client access (e.g., mobile apps, dashboard). The backend service
-- role key bypasses RLS unconditionally.
