-- ============================================================
-- Migration: Create doctor_schedules table
-- Per-doctor availability (days + hours)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(clinic_id, doctor_id, day_of_week)
);
