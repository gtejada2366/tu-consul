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
