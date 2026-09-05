-- Migration: 006_add_variants_matrix_to_products.sql
-- Purpose: Add multi-attribute variants matrix JSONB column to products table.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
