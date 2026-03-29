-- ============================================================
-- Migration: Create invoice_payments table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Efectivo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
