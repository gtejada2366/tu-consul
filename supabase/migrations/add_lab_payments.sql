-- ============================================================
-- Migration: Add lab_payments table for partial payments
-- Run in Supabase SQL Editor
-- ============================================================

-- Add amount_paid column to lab_orders
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;

-- Create lab_payments table for individual payment records
CREATE TABLE IF NOT EXISTS lab_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Efectivo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_payments_order ON lab_payments(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_payments_clinic ON lab_payments(clinic_id);

-- RLS policies
ALTER TABLE lab_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lab_payments_select" ON lab_payments
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "lab_payments_insert" ON lab_payments
  FOR INSERT WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "lab_payments_delete" ON lab_payments
  FOR DELETE USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );
