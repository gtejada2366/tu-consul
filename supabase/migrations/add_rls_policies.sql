-- Row Level Security (RLS) Policies for Multi-Tenant Isolation
-- Run this in Supabase SQL Editor
-- Each user can only access data from their own clinic

-- Helper: get the current user's clinic_id
CREATE OR REPLACE FUNCTION auth.user_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT clinic_id FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================
-- CLINICS
-- ============================================================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clinic"
  ON clinics FOR SELECT
  USING (id = auth.user_clinic_id());

-- ============================================================
-- USERS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in their clinic"
  ON users FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- PATIENTS
-- ============================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view patients in their clinic"
  ON patients FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert patients in their clinic"
  ON patients FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update patients in their clinic"
  ON patients FOR UPDATE
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can delete patients in their clinic"
  ON patients FOR DELETE
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- APPOINTMENTS
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments in their clinic"
  ON appointments FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert appointments in their clinic"
  ON appointments FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update appointments in their clinic"
  ON appointments FOR UPDATE
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can delete appointments in their clinic"
  ON appointments FOR DELETE
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- CONSULTATIONS
-- ============================================================
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consultations in their clinic"
  ON consultations FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert consultations in their clinic"
  ON consultations FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update consultations in their clinic"
  ON consultations FOR UPDATE
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- PRESCRIPTIONS (via parent consultation)
-- ============================================================
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prescriptions via consultation"
  ON prescriptions FOR SELECT
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = auth.user_clinic_id()
    )
  );

CREATE POLICY "Users can insert prescriptions via consultation"
  ON prescriptions FOR INSERT
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = auth.user_clinic_id()
    )
  );

-- ============================================================
-- LAB_RESULTS (via parent consultation)
-- ============================================================
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lab results via consultation"
  ON lab_results FOR SELECT
  USING (
    consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = auth.user_clinic_id()
    )
  );

CREATE POLICY "Users can insert lab results via consultation"
  ON lab_results FOR INSERT
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = auth.user_clinic_id()
    )
  );

-- ============================================================
-- INVOICES
-- ============================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices in their clinic"
  ON invoices FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert invoices in their clinic"
  ON invoices FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update invoices in their clinic"
  ON invoices FOR UPDATE
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- CLINIC_SCHEDULES
-- ============================================================
ALTER TABLE clinic_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules in their clinic"
  ON clinic_schedules FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can manage schedules in their clinic"
  ON clinic_schedules FOR ALL
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- CLINIC_SERVICES
-- ============================================================
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services in their clinic"
  ON clinic_services FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can manage services in their clinic"
  ON clinic_services FOR ALL
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- APPOINTMENT_SERVICES
-- ============================================================
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointment services in their clinic"
  ON appointment_services FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert appointment services in their clinic"
  ON appointment_services FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

-- ============================================================
-- CLINIC_BRANCHES
-- ============================================================
ALTER TABLE clinic_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view branches in their clinic"
  ON clinic_branches FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can manage branches in their clinic"
  ON clinic_branches FOR ALL
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- LAB_ORDERS
-- ============================================================
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lab orders in their clinic"
  ON lab_orders FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert lab orders in their clinic"
  ON lab_orders FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update lab orders in their clinic"
  ON lab_orders FOR UPDATE
  USING (clinic_id = auth.user_clinic_id());

-- ============================================================
-- NOTIFICATION_PREFERENCES
-- ============================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification prefs"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notification prefs"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- CLINIC_SUNAT_CONFIG (admin only via service role)
-- ============================================================
ALTER TABLE clinic_sunat_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SUNAT config in their clinic"
  ON clinic_sunat_config FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

-- INSERT/UPDATE handled by service role in API endpoints (admin check in code)

-- ============================================================
-- COMPROBANTES_ELECTRONICOS
-- ============================================================
ALTER TABLE comprobantes_electronicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comprobantes in their clinic"
  ON comprobantes_electronicos FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

-- INSERT handled by service role in API endpoints

-- ============================================================
-- COMPROBANTE_ITEMS (via parent comprobante)
-- ============================================================
ALTER TABLE comprobante_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comprobante items via comprobante"
  ON comprobante_items FOR SELECT
  USING (
    comprobante_id IN (
      SELECT id FROM comprobantes_electronicos WHERE clinic_id = auth.user_clinic_id()
    )
  );

-- INSERT handled by service role in API endpoints

-- ============================================================
-- POTENTIAL_TREATMENTS
-- ============================================================
ALTER TABLE potential_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view potential treatments in their clinic"
  ON potential_treatments FOR SELECT
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can insert potential treatments in their clinic"
  ON potential_treatments FOR INSERT
  WITH CHECK (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can update potential treatments in their clinic"
  ON potential_treatments FOR UPDATE
  USING (clinic_id = auth.user_clinic_id());

CREATE POLICY "Users can delete potential treatments in their clinic"
  ON potential_treatments FOR DELETE
  USING (clinic_id = auth.user_clinic_id());
