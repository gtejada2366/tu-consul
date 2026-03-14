-- ============================================================
-- Migration: Create lab_orders table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  lab_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  teeth TEXT,
  material TEXT,
  shade TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'ordered',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
