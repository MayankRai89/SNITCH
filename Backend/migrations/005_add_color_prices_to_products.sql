-- Migration: 005_add_color_prices_to_products.sql
-- Purpose: Add color_prices JSONB column to products for color/variant-specific pricing.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color_prices JSONB DEFAULT '{}'::jsonb;
