// ============================================================
// Database types for Supabase
// In production, generate these with: npx supabase gen types typescript
// ============================================================

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: Clinic;
        Insert: Omit<Clinic, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Clinic, "id">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id">>;
      };
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Patient, "id">>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Appointment, "id">>;
      };
      consultations: {
        Row: Consultation;
        Insert: Omit<Consultation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Consultation, "id">>;
      };
      prescriptions: {
        Row: Prescription;
        Insert: Omit<Prescription, "id">;
        Update: Partial<Omit<Prescription, "id">>;
      };
      lab_results: {
        Row: LabResult;
        Insert: Omit<LabResult, "id">;
        Update: Partial<Omit<LabResult, "id">>;
      };
      potential_treatments: {
        Row: PotentialTreatment;
        Insert: Omit<PotentialTreatment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PotentialTreatment, "id">>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Invoice, "id">>;
      };
      lab_orders: {
        Row: LabOrder;
        Insert: Omit<LabOrder, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LabOrder, "id">>;
      };
      clinic_schedules: {
        Row: ClinicSchedule;
        Insert: Omit<ClinicSchedule, "id">;
        Update: Partial<Omit<ClinicSchedule, "id">>;
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: Omit<NotificationPreferences, "id">;
        Update: Partial<Omit<NotificationPreferences, "id">>;
      };
    };
    Views: {
      patients_with_stats: {
        Row: PatientWithStats;
      };
    };
    Functions: {
      get_dashboard_stats: {
        Args: { p_clinic_id: string };
        Returns: DashboardStats;
      };
    };
  };
}

// ============================================================
// Entity types
// ============================================================

export interface Clinic {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  specialties: string[];
  plan: "free" | "basic" | "premium";
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clinic_id: string;
  full_name: string;
  email: string;
  role: "admin" | "doctor" | "receptionist";
  specialty: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthdate: string | null;
  blood_type: string | null;
  allergies: string[];
  status: "active" | "inactive";
  notes: string | null;
  // Filiation: Personal data
  document_type: string | null;
  document_number: string | null;
  gender: string | null;
  marital_status: string | null;
  occupation: string | null;
  nationality: string | null;
  education_level: string | null;
  // Filiation: Contact extensions
  phone_mobile: string | null;
  city: string | null;
  district: string | null;
  address_reference: string | null;
  // Filiation: Emergency contact
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  // Filiation: Medical background
  chronic_conditions: string[];
  current_medications: string | null;
  previous_surgeries: string | null;
  hospitalizations: string | null;
  family_history: string | null;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  smoking: boolean;
  alcohol_consumption: boolean;
  // Filiation: Dental background
  previous_dental_treatments: string | null;
  bruxism: boolean;
  dental_sensitivity: boolean;
  bleeding_gums: boolean;
  orthodontic_history: boolean;
  last_dental_visit: string | null;
  dental_hygiene_frequency: string | null;
  dental_notes: string | null;
  // Interest tags (marketing)
  interest_tags: string[];
  // Filiation: Insurance
  insurance_company: string | null;
  insurance_plan: string | null;
  insurance_member_number: string | null;
  insurance_effective_date: string | null;
  insurance_expiry_date: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PatientWithStats extends Patient {
  age: number | null;
  total_visits: number;
  last_visit: string | null;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  type: string;
  status: "pending" | "confirmed" | "in_transit" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithRelations extends Appointment {
  patient: Pick<Patient, "full_name">;
  doctor: Pick<User, "full_name">;
}

export interface Consultation {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  date: string;
  time: string | null;
  type: "consulta" | "prescription" | "lab";
  title: string;
  description: string | null;
  blood_pressure: string | null;
  temperature: string | null;
  weight: string | null;
  height: string | null;
  diagnosis: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationWithRelations extends Consultation {
  prescriptions: Prescription[];
  lab_results: LabResult[];
}

export interface Prescription {
  id: string;
  consultation_id: string;
  medication_name: string;
  dosage: string;
  duration: string;
}

export interface LabResult {
  id: string;
  consultation_id: string;
  test_name: string;
  result: string;
  status: "normal" | "abnormal";
}

export interface PotentialTreatment {
  id: string;
  clinic_id: string;
  patient_id: string;
  service: string;
  estimated_amount: number;
  quantity: number;
  notes: string | null;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface TreatmentPayment {
  id: string;
  clinic_id: string;
  treatment_id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_number: string;
  date: string;
  amount: number;
  amount_paid: number;
  service: string;
  payment_method: string | null;
  status: "paid" | "pending" | "overdue";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithPatient extends Invoice {
  patient: Pick<Patient, "full_name">;
}

export interface ClinicService {
  id: string;
  clinic_id: string;
  name: string;
  price: number;
  min_price: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  clinic_id: string;
  service_id: string | null;
  service_name: string;
  price: number;
  quantity: number;
  created_at: string;
}

export interface ClinicBranch {
  id: string;
  clinic_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicSchedule {
  id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  new_appointments: boolean;
  appointment_reminders: boolean;
  appointment_changes: boolean;
  patient_messages: boolean;
  system_updates: boolean;
}

export interface LabOrder {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  lab_name: string;
  item_description: string;
  teeth: string | null;
  material: string | null;
  shade: string | null;
  order_date: string;
  due_date: string | null;
  received_date: string | null;
  status: "ordered" | "in_progress" | "received";
  payment_status: "pending" | "paid";
  cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabOrderWithRelations extends LabOrder {
  patient: Pick<Patient, "full_name">;
  doctor: Pick<User, "full_name">;
}

export interface DashboardStats {
  appointments_today: number;
  occupancy_pct: number;
  new_patients_month: number;
  revenue_today: number;
}

// SUNAT types
export interface ClinicSunatConfig {
  id: string;
  clinic_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion_fiscal: string | null;
  ubigeo: string | null;
  sol_user: string;
  sol_password: string;
  certificate_path: string | null;
  certificate_password: string;
  serie_boleta: string;
  serie_factura: string;
  serie_nota_credito_b: string;
  serie_nota_credito_f: string;
  next_boleta: number;
  next_factura: number;
  is_production: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Odontogram types
// ============================================================

export type ToothConditionType =
  | "caries" | "obturacion" | "extraccion" | "ausente" | "corona"
  | "endodoncia" | "fractura" | "implante" | "protesis" | "sellante";

export type ToothSurface = "oclusal" | "mesial" | "distal" | "vestibular" | "lingual" | "whole";

export interface ToothCondition {
  id: string;
  odontogram_record_id: string;
  tooth_number: number;
  surface: ToothSurface;
  condition: ToothConditionType;
  notes: string | null;
  created_at: string;
}

export interface OdontogramRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  consultation_id: string | null;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OdontogramWithConditions extends OdontogramRecord {
  tooth_conditions: ToothCondition[];
  doctor?: { full_name: string };
}

export type ToothConditionsMap = Record<number, ToothCondition[]>;

// ============================================================
// Subscription / Payment types
// ============================================================

export interface SubscriptionTransaction {
  id: string;
  clinic_id: string;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  plan: "basic" | "premium";
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  period_start: string | null;
  period_end: string | null;
  payer_email: string | null;
  mp_status_detail: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanConfig {
  key: "free" | "basic" | "premium";
  name: string;
  price: number; // PEN / month
  features: string[];
  limits: {
    patients: number;    // -1 = unlimited
    users: number;
    branches: number;
  };
}

export interface ComprobanteElectronico {
  id: string;
  clinic_id: string;
  invoice_id: string | null;
  tipo_comprobante: "01" | "03" | "07" | "08";
  serie: string;
  correlativo: number;
  fecha_emision: string;
  cliente_tipo_doc: string;
  cliente_numero_doc: string;
  cliente_razon_social: string;
  cliente_direccion: string | null;
  total_gravada: number;
  total_igv: number;
  total_venta: number;
  moneda: string;
  sunat_status: "pending" | "sent" | "accepted" | "accepted_with_observations" | "rejected" | "error" | "voided";
  sunat_response_code: string | null;
  sunat_description: string | null;
  resumen_ticket: string | null;
  xml_signed_path: string | null;
  cdr_path: string | null;
  hash_cpe: string | null;
  created_at: string;
  updated_at: string;
}
