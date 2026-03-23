-- ============================================================
-- Tu Consul — Esquema de Base de Datos para Supabase
--
-- INSTRUCCIONES:
-- 1. Crear un proyecto en https://supabase.com
-- 2. Ir a SQL Editor
-- 3. Pegar y ejecutar este archivo completo
-- 4. Luego ejecutar seed.sql para datos de prueba
-- ============================================================

-- ============================================================
-- TABLA: clinics (Multi-tenant)
-- ============================================================
CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  specialties TEXT[] DEFAULT '{}',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: users (Perfil extendido)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  specialty TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: clinic_schedules
-- ============================================================
CREATE TABLE clinic_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(clinic_id, day_of_week)
);

-- ============================================================
-- TABLA: patients
-- ============================================================
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  birthdate DATE,
  blood_type TEXT,
  allergies TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  -- Personal data (filiation)
  document_type TEXT,
  document_number TEXT,
  gender TEXT,
  marital_status TEXT,
  occupation TEXT,
  nationality TEXT,
  education_level TEXT,
  -- Contact extensions
  phone_mobile TEXT,
  city TEXT,
  district TEXT,
  address_reference TEXT,
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  -- Medical background
  chronic_conditions TEXT[] DEFAULT '{}',
  current_medications TEXT,
  previous_surgeries TEXT,
  hospitalizations TEXT,
  family_history TEXT,
  is_pregnant BOOLEAN DEFAULT FALSE,
  is_breastfeeding BOOLEAN DEFAULT FALSE,
  smoking BOOLEAN DEFAULT FALSE,
  alcohol_consumption BOOLEAN DEFAULT FALSE,
  -- Dental background
  previous_dental_treatments TEXT,
  bruxism BOOLEAN DEFAULT FALSE,
  dental_sensitivity BOOLEAN DEFAULT FALSE,
  bleeding_gums BOOLEAN DEFAULT FALSE,
  orthodontic_history BOOLEAN DEFAULT FALSE,
  last_dental_visit DATE,
  dental_hygiene_frequency TEXT,
  dental_notes TEXT,
  -- Insurance
  insurance_company TEXT,
  insurance_plan TEXT,
  insurance_member_number TEXT,
  insurance_effective_date DATE,
  insurance_expiry_date DATE,
  -- Marketing
  interest_tags TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_status ON patients(clinic_id, status);

-- ============================================================
-- TABLA: appointments
-- ============================================================
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  doctor_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_transit', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_date ON appointments(clinic_id, date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, date);

-- ============================================================
-- TABLA: consultations (Historia Clínica)
-- ============================================================
CREATE TABLE consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  doctor_id UUID REFERENCES users(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  date DATE NOT NULL,
  time TIME,
  type TEXT NOT NULL CHECK (type IN ('consulta', 'prescription', 'lab')),
  title TEXT NOT NULL,
  description TEXT,
  blood_pressure TEXT,
  temperature TEXT,
  weight TEXT,
  height TEXT,
  diagnosis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_patient ON consultations(patient_id, date DESC);

-- ============================================================
-- TABLA: prescriptions
-- ============================================================
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  duration TEXT NOT NULL
);

-- ============================================================
-- TABLA: lab_results
-- ============================================================
CREATE TABLE lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  test_name TEXT NOT NULL,
  result TEXT NOT NULL,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'abnormal'))
);

-- ============================================================
-- TABLA: invoices
-- ============================================================
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  invoice_number TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  service TEXT NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_clinic_date ON invoices(clinic_id, date DESC);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(clinic_id, status);

-- ============================================================
-- TABLA: notification_preferences
-- ============================================================
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  new_appointments BOOLEAN DEFAULT TRUE,
  appointment_reminders BOOLEAN DEFAULT TRUE,
  appointment_changes BOOLEAN DEFAULT TRUE,
  patient_messages BOOLEAN DEFAULT FALSE,
  system_updates BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- ============================================================
-- TABLA: clinic_services (Servicios y Precios)
-- ============================================================
CREATE TABLE clinic_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clinic_services_clinic ON clinic_services(clinic_id);

-- ============================================================
-- TABLA: appointment_services (Servicios realizados por cita)
-- ============================================================
CREATE TABLE appointment_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  service_id UUID REFERENCES clinic_services(id),
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_services_apt ON appointment_services(appointment_id);

-- ============================================================
-- TABLA: clinic_branches (Sedes / Sucursales)
-- ============================================================
CREATE TABLE clinic_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clinic_branches_clinic ON clinic_branches(clinic_id);

-- ============================================================
-- VISTA: patients_with_stats
-- ============================================================
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

-- ============================================================
-- FUNCIÓN: Auto-generar número de factura
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'FAC-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INT)), 0) + 1
     FROM invoices WHERE clinic_id = NEW.clinic_id)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================================
-- FUNCIÓN: Dashboard stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_clinic_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'appointments_today', (
      SELECT COUNT(*) FROM appointments
      WHERE clinic_id = p_clinic_id AND date = CURRENT_DATE AND status != 'cancelled'
    ),
    'occupancy_pct', (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed'))::DECIMAL / GREATEST(COUNT(*), 1) * 100)
      END
      FROM appointments
      WHERE clinic_id = p_clinic_id AND date = CURRENT_DATE
    ),
    'new_patients_month', (
      SELECT COUNT(*) FROM patients
      WHERE clinic_id = p_clinic_id AND created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'revenue_today', (
      SELECT COALESCE(SUM(amount), 0) FROM invoices
      WHERE clinic_id = p_clinic_id AND date = CURRENT_DATE AND status = 'paid'
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- PERMISOS: Permitir acceso público (sin RLS)
-- La seguridad se maneja desde la aplicación filtrando por clinic_id
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
