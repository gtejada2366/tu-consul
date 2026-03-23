-- Track partial payments against potential treatments
CREATE TABLE IF NOT EXISTS treatment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  treatment_id UUID REFERENCES potential_treatments(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by treatment
CREATE INDEX IF NOT EXISTS idx_treatment_payments_treatment ON treatment_payments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_clinic ON treatment_payments(clinic_id);
