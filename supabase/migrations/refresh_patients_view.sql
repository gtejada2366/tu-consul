-- ============================================================
-- Migration: Refresh patients_with_stats view
--
-- The view was created with SELECT p.* BEFORE the filiation
-- and interest_tags columns were added to the patients table.
-- PostgreSQL resolves * at view-creation time, so the view
-- was still returning only the original columns.
--
-- Run this in Supabase SQL Editor to pick up all new columns.
-- ============================================================

DROP VIEW IF EXISTS patients_with_stats;

CREATE VIEW patients_with_stats AS
SELECT
  p.*,
  EXTRACT(YEAR FROM AGE(p.birthdate))::INT AS age,
  COALESCE(
    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.status = 'completed'),
    0
  )::INT AS total_visits,
  (SELECT MAX(a.date) FROM appointments a WHERE a.patient_id = p.id AND a.status = 'completed') AS last_visit
FROM patients p;
