-- ============================================================
-- Migration: Add requires_lab flag to clinic_services
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE clinic_services
ADD COLUMN requires_lab BOOLEAN DEFAULT FALSE;
