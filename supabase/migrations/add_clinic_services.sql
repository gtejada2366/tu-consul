-- ============================================================
-- Migración: Agregar tablas clinic_services y appointment_services
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS clinic_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic ON clinic_services(clinic_id);

CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  service_id UUID REFERENCES clinic_services(id),
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_apt ON appointment_services(appointment_id);

GRANT ALL ON clinic_services TO anon;
GRANT ALL ON clinic_services TO authenticated;
GRANT ALL ON appointment_services TO anon;
GRANT ALL ON appointment_services TO authenticated;
