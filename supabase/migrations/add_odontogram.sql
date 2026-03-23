-- Odontogram: dental chart records and tooth conditions
-- Run in Supabase SQL Editor

-- Registro padre (snapshot por evaluación)
CREATE TABLE IF NOT EXISTS odontogram_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Condiciones por diente/superficie
CREATE TABLE IF NOT EXISTS tooth_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odontogram_record_id UUID NOT NULL REFERENCES odontogram_records(id) ON DELETE CASCADE,
  tooth_number SMALLINT NOT NULL CHECK (
    tooth_number BETWEEN 11 AND 18 OR tooth_number BETWEEN 21 AND 28 OR
    tooth_number BETWEEN 31 AND 38 OR tooth_number BETWEEN 41 AND 48
  ),
  surface TEXT NOT NULL DEFAULT 'whole' CHECK (surface IN ('oclusal','mesial','distal','vestibular','lingual','whole')),
  condition TEXT NOT NULL CHECK (condition IN ('caries','obturacion','extraccion','ausente','corona','endodoncia','fractura','implante','protesis','sellante')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vincular tratamientos potenciales a dientes
ALTER TABLE potential_treatments
  ADD COLUMN IF NOT EXISTS tooth_number SMALLINT;

-- Indices
CREATE INDEX IF NOT EXISTS idx_odontogram_patient ON odontogram_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_tooth_cond_record ON tooth_conditions(odontogram_record_id);

-- RLS
ALTER TABLE odontogram_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_isolation" ON odontogram_records FOR ALL
  USING (clinic_id = public.user_clinic_id());

CREATE POLICY "clinic_isolation_via_record" ON tooth_conditions FOR ALL
  USING (odontogram_record_id IN (
    SELECT id FROM odontogram_records WHERE clinic_id = public.user_clinic_id()
  ));
