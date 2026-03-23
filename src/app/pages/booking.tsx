import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabase";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface Doctor {
  id: string;
  full_name: string;
  specialty: string | null;
  avatar_url: string | null;
}

interface Schedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ExistingAppointment {
  start_time: string;
  duration_minutes: number;
}

// ============================================================
// Helpers
// ============================================================

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function to12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let minutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (minutes + 30 <= endMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minutes += 30;
  }
  return slots;
}

/** JS getDay() returns 0=Sun. DB uses 0=Mon..5=Sat, 6=Sun */
function jsToDbDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ============================================================
// Component
// ============================================================

export function Booking() {
  const { clinicId } = useParams<{ clinicId: string }>();

  // Clinic data
  const [clinicName, setClinicName] = useState("");
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicError, setClinicError] = useState(false);

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Doctor
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Step 2: Date
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Step 3: Time
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 4: Patient info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // --------------------------------------------------------
  // Fetch clinic info
  // --------------------------------------------------------
  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("name")
        .eq("id", clinicId)
        .single();
      if (error || !data) {
        setClinicError(true);
      } else {
        setClinicName((data as Record<string, unknown>).name as string);
      }
      setClinicLoading(false);
    })();
  }, [clinicId]);

  // --------------------------------------------------------
  // Fetch doctors
  // --------------------------------------------------------
  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      setDoctorsLoading(true);
      const { data } = await supabase
        .from("users")
        .select("id, full_name, specialty, avatar_url")
        .eq("clinic_id", clinicId)
        .eq("role", "doctor")
        .eq("is_active", true)
        .order("full_name");
      if (data) setDoctors(data as unknown as Doctor[]);
      setDoctorsLoading(false);
    })();
  }, [clinicId]);

  // --------------------------------------------------------
  // Fetch schedules
  // --------------------------------------------------------
  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      const { data } = await supabase
        .from("clinic_schedules")
        .select("day_of_week, start_time, end_time, is_active")
        .eq("clinic_id", clinicId)
        .eq("is_active", true);
      if (data) setSchedules(data as unknown as Schedule[]);
    })();
  }, [clinicId]);

  // --------------------------------------------------------
  // Fetch existing appointments for selected doctor + date
  // --------------------------------------------------------
  useEffect(() => {
    if (!clinicId || !selectedDoctor || !selectedDate) return;
    (async () => {
      setTimeSlotsLoading(true);
      const dateStr = toLocalDateStr(selectedDate);
      const { data } = await supabase
        .from("appointments")
        .select("start_time, duration_minutes")
        .eq("clinic_id", clinicId)
        .eq("doctor_id", selectedDoctor.id)
        .eq("date", dateStr)
        .neq("status", "cancelled");
      if (data) setExistingAppointments(data as unknown as ExistingAppointment[]);
      setTimeSlotsLoading(false);
    })();
  }, [clinicId, selectedDoctor, selectedDate]);

  // --------------------------------------------------------
  // Calendar logic
  // --------------------------------------------------------
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return d;
  }, [today]);

  /** Set of active db day_of_week values */
  const activeDays = useMemo(
    () => new Set(schedules.filter((s) => s.is_active).map((s) => s.day_of_week)),
    [schedules],
  );

  const isDateSelectable = useCallback(
    (date: Date) => {
      if (date < today) return false;
      if (date > maxDate) return false;
      const dbDay = jsToDbDayOfWeek(date.getDay());
      return activeDays.has(dbDay);
    },
    [today, maxDate, activeDays],
  );

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [calendarMonth]);

  // --------------------------------------------------------
  // Time slots
  // --------------------------------------------------------
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dbDay = jsToDbDayOfWeek(selectedDate.getDay());
    const schedule = schedules.find((s) => s.day_of_week === dbDay && s.is_active);
    if (!schedule) return [];

    const allSlots = generateSlots(
      schedule.start_time.slice(0, 5),
      schedule.end_time.slice(0, 5),
    );

    // Build set of taken time ranges
    const takenMinutes = new Set<number>();
    for (const appt of existingAppointments) {
      const [h, m] = appt.start_time.slice(0, 5).split(":").map(Number);
      const start = h * 60 + m;
      const dur = appt.duration_minutes || 30;
      for (let t = start; t < start + dur; t += 30) {
        takenMinutes.add(t);
      }
    }

    // Filter out past times if selectedDate is today
    const isToday = toLocalDateStr(selectedDate) === toLocalDateStr(today);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    return allSlots.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const mins = h * 60 + m;
      if (takenMinutes.has(mins)) return false;
      if (isToday && mins <= nowMinutes) return false;
      return true;
    });
  }, [selectedDate, schedules, existingAppointments, today]);

  // --------------------------------------------------------
  // Submit
  // --------------------------------------------------------
  const handleSubmit = async () => {
    if (!clinicId || !selectedDoctor || !selectedDate || !selectedTime) return;
    if (!fullName.trim() || !phone.trim()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      // Find or create patient
      const { data: existingPatients } = await supabase
        .from("patients")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("phone", phone.trim())
        .limit(1);

      let patientId: string;

      if (existingPatients && existingPatients.length > 0) {
        patientId = (existingPatients[0] as Record<string, unknown>).id as string;
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            clinic_id: clinicId,
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
            status: "active",
            allergies: [],
            chronic_conditions: [],
            interest_tags: [],
            is_pregnant: false,
            is_breastfeeding: false,
            smoking: false,
            alcohol_consumption: false,
            bruxism: false,
            dental_sensitivity: false,
            bleeding_gums: false,
            orthodontic_history: false,
          } as Record<string, unknown>)
          .select("id")
          .single();

        if (patientError || !newPatient) {
          throw new Error(patientError?.message || "No se pudo crear el paciente");
        }
        patientId = (newPatient as Record<string, unknown>).id as string;
      }

      // Create appointment
      const { error: apptError } = await supabase.from("appointments").insert({
        clinic_id: clinicId,
        patient_id: patientId,
        doctor_id: selectedDoctor.id,
        date: toLocalDateStr(selectedDate),
        start_time: selectedTime,
        duration_minutes: 30,
        type: "Primera Vez",
        status: "pending",
        notes: notes.trim() || null,
      } as Record<string, unknown>);

      if (apptError) {
        throw new Error(apptError.message);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------------
  // Navigation helpers
  // --------------------------------------------------------
  const canGoBack = step > 1 && !submitted;

  const goBack = () => {
    if (step === 2) {
      setSelectedDate(null);
      setSelectedTime(null);
    }
    if (step === 3) {
      setSelectedTime(null);
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const selectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(2);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(3);
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  // --------------------------------------------------------
  // Loading / error states
  // --------------------------------------------------------
  if (clinicLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (clinicError || !clinicId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Clínica no encontrada
          </h2>
          <p className="text-gray-500">
            El enlace de reserva no es válido o la clínica ya no está disponible.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Success state
  // --------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-white">{clinicName}</h1>
        </div>

        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Cita reservada!
            </h2>
            <p className="text-gray-500 mb-6">
              Te confirmaremos por WhatsApp.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  Dr(a). {selectedDoctor?.full_name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  {selectedDate?.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-gray-700">
                  {selectedTime ? to12h(selectedTime) : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Main render
  // --------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white">{clinicName}</h1>
        <p className="text-blue-100 mt-1 text-sm">Reserva tu cita online</p>
      </div>

      {/* Step indicator */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Doctor" },
              { num: 2, label: "Fecha" },
              { num: 3, label: "Hora" },
              { num: 4, label: "Datos" },
            ].map(({ num, label }) => (
              <div key={num} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step > num ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    num
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step >= num ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back button */}
        {canGoBack && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>
        )}

        {/* ================================================ */}
        {/* STEP 1 — Select doctor                            */}
        {/* ================================================ */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Elige tu doctor
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona el profesional con quien deseas atenderte.
            </p>

            {doctorsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-500">
                  No hay doctores disponibles en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => selectDoctor(doc)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 border border-gray-100 transition-all flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      {doc.avatar_url ? (
                        <img
                          src={doc.avatar_url}
                          alt={doc.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        Dr(a). {doc.full_name}
                      </p>
                      {doc.specialty && (
                        <p className="text-sm text-gray-500 truncate">
                          {doc.specialty}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================ */}
        {/* STEP 2 — Select date                              */}
        {/* ================================================ */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Elige una fecha
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona el día que más te convenga.
            </p>

            <div className="bg-white rounded-xl shadow-sm p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const prev = new Date(calendarMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    if (prev.getMonth() >= today.getMonth() || prev.getFullYear() > today.getFullYear()) {
                      setCalendarMonth(prev);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900 capitalize">
                  {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </span>
                <button
                  onClick={() => {
                    const next = new Date(calendarMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarMonth(next);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                  (d) => (
                    <div
                      key={d}
                      className="text-xs font-medium text-gray-400 text-center py-1"
                    >
                      {d}
                    </div>
                  ),
                )}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} />;
                  }
                  const selectable = isDateSelectable(date);
                  const isSelected =
                    selectedDate &&
                    toLocalDateStr(date) === toLocalDateStr(selectedDate);
                  const isCurrentToday =
                    toLocalDateStr(date) === toLocalDateStr(today);

                  return (
                    <button
                      key={date.toISOString()}
                      disabled={!selectable}
                      onClick={() => selectable && selectDate(date)}
                      className={`h-10 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md"
                          : selectable
                            ? "hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                            : "text-gray-300 cursor-not-allowed"
                      } ${isCurrentToday && !isSelected ? "ring-2 ring-blue-200" : ""}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================ */}
        {/* STEP 3 — Select time                              */}
        {/* ================================================ */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Elige un horario
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedDate?.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              — Dr(a). {selectedDoctor?.full_name}
            </p>

            {timeSlotsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1 font-medium">
                  Sin horarios disponibles
                </p>
                <p className="text-sm text-gray-400">
                  Prueba con otra fecha o doctor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => selectTime(slot)}
                    className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedTime === slot
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-100 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
                    }`}
                  >
                    {to12h(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================ */}
        {/* STEP 4 — Patient info                             */}
        {/* ================================================ */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Tus datos
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Ingresa tu información para confirmar la cita.
            </p>

            {/* Summary card */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <User className="w-4 h-4 shrink-0" />
                Dr(a). {selectedDoctor?.full_name}
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-4 h-4 shrink-0" />
                {selectedDate?.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-4 h-4 shrink-0" />
                {selectedTime ? to12h(selectedTime) : ""}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="999 999 999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de consulta{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe brevemente el motivo de tu visita..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                  />
                </div>
              </div>

              {/* Error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !fullName.trim() || !phone.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmar Cita
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        Reservas en línea por Tu Consul
      </div>
    </div>
  );
}
