-- ============================================================
-- Migration: Add quantity field to lab_orders
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE lab_orders
ADD COLUMN quantity INT NOT NULL DEFAULT 1;
