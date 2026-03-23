// ============================================================
// Centralized constants — single source of truth for all
// hardcoded options used across the app.
// ============================================================

export const APPOINTMENT_TYPES = [
  "Consulta General",
  "Primera Vez",
  "Control",
  "Seguimiento",
  "Urgencia",
  "Limpieza",
  "Ortodoncia",
  "Endodoncia",
];

/** Color config per appointment type: [bg class, border class, dot color] */
export const TYPE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  "Consulta General": { bg: "bg-blue-50",    border: "border-blue-400",    dot: "bg-blue-400" },
  "Primera Vez":      { bg: "bg-violet-50",  border: "border-violet-400",  dot: "bg-violet-400" },
  "Control":          { bg: "bg-teal-50",    border: "border-teal-400",    dot: "bg-teal-400" },
  "Seguimiento":      { bg: "bg-cyan-50",    border: "border-cyan-400",    dot: "bg-cyan-400" },
  "Urgencia":         { bg: "bg-red-50",     border: "border-red-400",     dot: "bg-red-400" },
  "Limpieza":         { bg: "bg-emerald-50", border: "border-emerald-400", dot: "bg-emerald-400" },
  "Ortodoncia":       { bg: "bg-amber-50",   border: "border-amber-400",   dot: "bg-amber-400" },
  "Endodoncia":       { bg: "bg-orange-50",  border: "border-orange-400",  dot: "bg-orange-400" },
};

const DEFAULT_TYPE_COLOR = { bg: "bg-gray-50", border: "border-gray-400", dot: "bg-gray-400" };

export function getTypeColor(type: string) {
  return TYPE_COLORS[type] || DEFAULT_TYPE_COLOR;
}

export const BILLING_SERVICES = [
  "Consulta General",
  "Primera Consulta",
  "Limpieza Dental",
  "Tratamiento de Conducto",
  "Corona Dental",
  "Extracción",
  "Ortodoncia",
  "Endodoncia",
  "Blanqueamiento",
  "Radiografía",
];

export const PAYMENT_METHODS = [
  "Efectivo",
  "Tarjeta de Crédito",
  "Tarjeta de Débito",
  "Transferencia",
  "Mercado Pago",
];

export const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

// ============================================================
// Subscription plans
// ============================================================
import type { SubscriptionPlanConfig } from "./types";

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    key: "free",
    name: "Gratis",
    price: 0,
    features: [
      "Hasta 50 pacientes",
      "1 usuario",
      "1 sede",
      "Agenda básica",
      "Historia clínica",
    ],
    limits: { patients: 50, users: 1, branches: 1 },
  },
  {
    key: "basic",
    name: "Básico",
    price: 99,
    features: [
      "Hasta 500 pacientes",
      "3 usuarios",
      "1 sede",
      "Agenda + Reportes",
      "Historia clínica",
      "Facturación electrónica",
      "Campañas WhatsApp",
    ],
    limits: { patients: 500, users: 3, branches: 1 },
  },
  {
    key: "premium",
    name: "Premium",
    price: 199,
    features: [
      "Pacientes ilimitados",
      "Usuarios ilimitados",
      "Sedes ilimitadas",
      "Agenda + Reportes",
      "Historia clínica",
      "Facturación electrónica",
      "Campañas WhatsApp",
      "Laboratorio",
      "Soporte prioritario",
    ],
    limits: { patients: -1, users: -1, branches: -1 },
  },
];

// Filiation constants
export const DOCUMENT_TYPES = ["DNI", "Pasaporte", "CE", "RUC", "Otro"];
export const GENDERS = ["Masculino", "Femenino", "Otro"];
export const MARITAL_STATUSES = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre"];
export const EDUCATION_LEVELS = ["Primaria", "Secundaria", "Técnico", "Universitario", "Postgrado", "Otro"];
export const DENTAL_HYGIENE_OPTIONS = ["1 vez al día", "2 veces al día", "3 veces al día", "Ocasional"];
export const CHRONIC_CONDITIONS_OPTIONS = [
  "Diabetes", "Hipertensión", "Asma", "Cardiopatía", "Epilepsia",
  "Hepatitis", "VIH/SIDA", "Artritis", "Tiroides", "Anemia",
];
export const RELATIONSHIPS = ["Padre/Madre", "Esposo/a", "Hijo/a", "Hermano/a", "Familiar", "Amigo/a", "Otro"];

// Lab order constants
export const LAB_ORDER_STATUSES: Record<string, string> = {
  ordered: "Pedido",
  in_progress: "En proceso",
  received: "Recibido",
};

export const LAB_ORDER_STATUS_VARIANTS: Record<string, "warning" | "default" | "success"> = {
  ordered: "warning",
  in_progress: "default",
  received: "success",
};

export const LAB_PAYMENT_STATUSES: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
};

export const LAB_ITEMS = [
  "Corona",
  "Puente",
  "Prótesis parcial",
  "Prótesis total",
  "Carilla",
  "Incrustación",
  "Placa oclusal",
  "Retenedor",
  "Provisorio",
  "Otro",
];

export const LAB_MATERIALS = [
  "Porcelana",
  "Zirconio",
  "Metal-porcelana",
  "Acrílico",
  "Resina",
  "Disilicato de litio",
  "Cromo-cobalto",
  "Oro",
  "Otro",
];

// Interest tags for marketing segmentation
export const INTEREST_TAGS = [
  // Treatment interests
  "Blanqueamiento",
  "Ortodoncia",
  "Implantes",
  "Carillas",
  "Prótesis",
  "Endodoncia",
  "Limpieza profunda",
  "Corona dental",
  "Cirugía oral",
  "Periodoncia",
  // Conditions / needs
  "Bruxismo",
  "Sensibilidad dental",
  "Enfermedad periodontal",
  "Caries múltiples",
  // Marketing segments
  "Paciente VIP",
  "Seguimiento pendiente",
  "Reactivar",
  "Referido",
];

export const INTEREST_TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Blanqueamiento":        { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "Ortodoncia":            { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  "Implantes":             { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  "Carillas":              { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  "Prótesis":              { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  "Endodoncia":            { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  "Limpieza profunda":     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Corona dental":         { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  "Cirugía oral":          { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  "Periodoncia":           { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  "Bruxismo":              { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-200" },
  "Sensibilidad dental":   { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200" },
  "Enfermedad periodontal":{ bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" },
  "Caries múltiples":      { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  "Paciente VIP":          { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" },
  "Seguimiento pendiente": { bg: "bg-lime-50",    text: "text-lime-700",    border: "border-lime-200" },
  "Reactivar":             { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  "Referido":              { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" },
};

const DEFAULT_TAG_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

export function getTagColor(tag: string) {
  return INTEREST_TAG_COLORS[tag] || DEFAULT_TAG_COLOR;
}

export const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
];

export const STATUS_COLORS: Record<string, "success" | "warning" | "default" | "danger"> = {
  confirmed: "success",
  pending: "warning",
  in_transit: "warning",
  in_progress: "success",
  completed: "default",
  cancelled: "danger",
};

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Por confirmar",
  in_transit: "En camino",
  in_progress: "En consulta",
  completed: "Completada",
  cancelled: "Cancelada",
};

/** Generate 30-min time slots between start and end (HH:MM format) */
export function generateTimeSlots(startTime = "08:00", endTime = "18:30"): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let minutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (minutes <= endMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minutes += 30;
  }

  return slots;
}

/** Format a Date to "YYYY-MM-DD" in LOCAL timezone (avoids UTC shift from toISOString) */
export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================================
// Odontogram constants
// ============================================================

/** FDI tooth numbering — 4 quadrants */
export const TEETH_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]; // Q1
export const TEETH_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]; // Q2
export const TEETH_LOWER_LEFT  = [38, 37, 36, 35, 34, 33, 32, 31]; // Q3
export const TEETH_LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48]; // Q4

/** Anterior teeth — single root, incisal edge */
export const ANTERIOR_TEETH = [11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43];

/** Tooth anatomical names (Spanish) */
export const TOOTH_NAMES: Record<number, string> = {
  11: "Incisivo central sup. der.", 12: "Incisivo lateral sup. der.", 13: "Canino sup. der.",
  14: "Primer premolar sup. der.", 15: "Segundo premolar sup. der.", 16: "Primer molar sup. der.",
  17: "Segundo molar sup. der.", 18: "Tercer molar sup. der.",
  21: "Incisivo central sup. izq.", 22: "Incisivo lateral sup. izq.", 23: "Canino sup. izq.",
  24: "Primer premolar sup. izq.", 25: "Segundo premolar sup. izq.", 26: "Primer molar sup. izq.",
  27: "Segundo molar sup. izq.", 28: "Tercer molar sup. izq.",
  31: "Incisivo central inf. izq.", 32: "Incisivo lateral inf. izq.", 33: "Canino inf. izq.",
  34: "Primer premolar inf. izq.", 35: "Segundo premolar inf. izq.", 36: "Primer molar inf. izq.",
  37: "Segundo molar inf. izq.", 38: "Tercer molar inf. izq.",
  41: "Incisivo central inf. der.", 42: "Incisivo lateral inf. der.", 43: "Canino inf. der.",
  44: "Primer premolar inf. der.", 45: "Segundo premolar inf. der.", 46: "Primer molar inf. der.",
  47: "Segundo molar inf. der.", 48: "Tercer molar inf. der.",
};

import type { ToothConditionType } from "./types";

/** Condition visual config — color, label, render type */
export const CONDITION_CONFIG: Record<ToothConditionType, { label: string; color: string; type: "fill" | "symbol" }> = {
  caries:      { label: "Caries",        color: "#DC2626", type: "fill" },
  obturacion:  { label: "Obturación",    color: "#2563EB", type: "fill" },
  extraccion:  { label: "Extracción",    color: "#DC2626", type: "symbol" },
  ausente:     { label: "Ausente",       color: "#9CA3AF", type: "symbol" },
  corona:      { label: "Corona",        color: "#D97706", type: "symbol" },
  endodoncia:  { label: "Endodoncia",    color: "#7C3AED", type: "symbol" },
  fractura:    { label: "Fractura",      color: "#DC2626", type: "symbol" },
  implante:    { label: "Implante",      color: "#16A34A", type: "symbol" },
  protesis:    { label: "Prótesis",      color: "#D97706", type: "symbol" },
  sellante:    { label: "Sellante",      color: "#8B5CF6", type: "fill" },
};

export const SURFACE_LABELS: Record<string, string> = {
  oclusal: "Oclusal",
  mesial: "Mesial",
  distal: "Distal",
  vestibular: "Vestibular",
  lingual: "Lingual",
  whole: "Completo",
};

/** Convert "HH:MM" (24h) to "h:mm AM/PM" (12h) */
export function to12h(time: string | null | undefined): string {
  if (!time) return "-";
  const [hStr, mStr] = time.slice(0, 5).split(":");
  let h = parseInt(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}
