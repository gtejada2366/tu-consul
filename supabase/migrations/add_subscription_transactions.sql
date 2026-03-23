-- ============================================================
-- TABLA: subscription_transactions
-- Registra cada pago de suscripción vía Mercado Pago
-- ============================================================
CREATE TABLE subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  mp_preference_id TEXT,
  mp_payment_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PEN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  period_start DATE,
  period_end DATE,
  payer_email TEXT,
  mp_status_detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sub_tx_clinic ON subscription_transactions(clinic_id);
CREATE INDEX idx_sub_tx_mp_payment ON subscription_transactions(mp_payment_id);
CREATE INDEX idx_sub_tx_status ON subscription_transactions(clinic_id, status);

-- Permisos
GRANT ALL ON subscription_transactions TO anon;
GRANT ALL ON subscription_transactions TO authenticated;
