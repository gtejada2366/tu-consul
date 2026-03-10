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
