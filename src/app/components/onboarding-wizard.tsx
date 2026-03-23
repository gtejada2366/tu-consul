import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Clock,
  Tag,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/auth-context";
import { supabase } from "../lib/supabase";

// ── Types ────────────────────────────────────────────────────
interface ScheduleRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ServiceOption {
  name: string;
  price: number;
  selected: boolean;
}

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DEFAULT_SCHEDULES: ScheduleRow[] = [
  { day_of_week: 0, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 1, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 2, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 3, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 4, start_time: "09:00", end_time: "18:00", is_active: true },
  { day_of_week: 5, start_time: "09:00", end_time: "13:00", is_active: true },
];

const DEFAULT_SERVICES: ServiceOption[] = [
  { name: "Consulta General", price: 50, selected: false },
  { name: "Limpieza Dental", price: 80, selected: false },
  { name: "Extracción Simple", price: 100, selected: false },
  { name: "Tratamiento de Conducto", price: 350, selected: false },
  { name: "Corona Dental", price: 500, selected: false },
  { name: "Ortodoncia (consulta)", price: 150, selected: false },
  { name: "Blanqueamiento", price: 250, selected: false },
  { name: "Radiografía", price: 30, selected: false },
];

// ── Step indicator ───────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      {/* Dots */}
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-medium transition-colors duration-300 ${
                i < current
                  ? "bg-primary text-white"
                  : i === current
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-surface-alt text-foreground-secondary"
              }`}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={`w-10 h-0.5 transition-colors duration-300 ${
                  i < current ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="w-full max-w-xs h-1.5 bg-surface-alt rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((current) / (total - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Slide wrapper ────────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

// ── Main component ───────────────────────────────────────────
export function OnboardingWizard() {
  const { clinic } = useAuth();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Schedule state
  const [schedules, setSchedules] = useState<ScheduleRow[]>(DEFAULT_SCHEDULES);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [schedulesCount, setSchedulesCount] = useState(0);

  // Services state
  const [services, setServices] = useState<ServiceOption[]>(DEFAULT_SERVICES);
  const [savingServices, setSavingServices] = useState(false);
  const [servicesCount, setServicesCount] = useState(0);

  // ── Check whether onboarding is needed ─────────────────────
  const checkOnboarding = useCallback(async () => {
    if (!clinic) return;

    const dismissedKey = `onboarding_dismissed_${clinic.id}`;
    if (localStorage.getItem(dismissedKey)) {
      setChecking(false);
      setVisible(false);
      return;
    }

    const [schedulesRes, servicesRes] = await Promise.all([
      supabase
        .from("clinic_schedules")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinic.id),
      supabase
        .from("clinic_services")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinic.id),
    ]);

    const hasSchedules = (schedulesRes.count ?? 0) > 0;
    const hasServices = (servicesRes.count ?? 0) > 0;

    setChecking(false);

    if (!hasSchedules && !hasServices) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [clinic]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  // ── Navigation helpers ─────────────────────────────────────
  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function dismiss() {
    if (!clinic) return;
    localStorage.setItem(`onboarding_dismissed_${clinic.id}`, "true");
    setVisible(false);
  }

  // ── Save schedules ────────────────────────────────────────
  async function handleSaveSchedules() {
    if (!clinic) return;
    setSavingSchedules(true);

    const { error } = await supabase.from("clinic_schedules").insert(
      schedules.map((s) => ({
        clinic_id: clinic.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      } as Record<string, unknown>))
    );

    setSavingSchedules(false);

    if (error) {
      console.error("Error saving schedules:", error.message);
      return;
    }

    setSchedulesCount(schedules.filter((s) => s.is_active).length);
    goNext();
  }

  // ── Save services ─────────────────────────────────────────
  async function handleSaveServices() {
    if (!clinic) return;

    const selected = services.filter((s) => s.selected);
    if (selected.length === 0) {
      goNext();
      return;
    }

    setSavingServices(true);

    const { error } = await supabase.from("clinic_services").insert(
      selected.map((s) => ({
        clinic_id: clinic.id,
        name: s.name,
        price: s.price,
        min_price: s.price,
        is_active: true,
      } as Record<string, unknown>))
    );

    setSavingServices(false);

    if (error) {
      console.error("Error saving services:", error.message);
      return;
    }

    setServicesCount(selected.length);
    goNext();
  }

  // ── Schedule row helpers ──────────────────────────────────
  function updateSchedule(index: number, field: keyof ScheduleRow, value: string | boolean) {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  // ── Service row helpers ───────────────────────────────────
  function toggleService(index: number) {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  }

  function updateServicePrice(index: number, price: number) {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, price } : s))
    );
  }

  // ── Don't render anything while checking or if not needed ─
  if (checking || !visible || !clinic) return null;

  // ── Step content ──────────────────────────────────────────
  const steps = [
    // Step 1: Welcome
    <motion.div
      key="welcome"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="text-center"
    >
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        ¡Bienvenido a Tu Consul!
      </h2>
      <p className="text-foreground-secondary mb-1 text-lg">{clinic.name}</p>
      <p className="text-foreground-secondary mb-8">
        Tu clínica está casi lista. Vamos a configurar lo básico en 3 pasos.
      </p>
      <Button variant="primary" size="lg" className="w-full" onClick={goNext}>
        Empezar
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
      <button
        type="button"
        className="mt-4 text-[0.8125rem] text-foreground-secondary hover:text-foreground underline underline-offset-2 transition-colors"
        onClick={dismiss}
      >
        Saltar configuración
      </button>
    </motion.div>,

    // Step 2: Schedules
    <motion.div
      key="schedules"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Configura tus horarios</h2>
          <p className="text-[0.8125rem] text-foreground-secondary">Días y horarios de atención</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {schedules.map((s, i) => (
          <div
            key={s.day_of_week}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              s.is_active ? "border-primary/30 bg-primary/5" : "border-border bg-surface"
            }`}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => updateSchedule(i, "is_active", !s.is_active)}
              className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                s.is_active ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  s.is_active ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>

            {/* Day name */}
            <span className="w-24 text-[0.875rem] font-medium text-foreground">
              {DAY_LABELS[i]}
            </span>

            {/* Time inputs */}
            {s.is_active ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={s.start_time}
                  onChange={(e) => updateSchedule(i, "start_time", e.target.value)}
                  className="h-8 px-2 bg-surface border border-border rounded-lg text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <span className="text-foreground-secondary text-[0.8125rem]">a</span>
                <input
                  type="time"
                  value={s.end_time}
                  onChange={(e) => updateSchedule(i, "end_time", e.target.value)}
                  className="h-8 px-2 bg-surface border border-border rounded-lg text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ) : (
              <span className="text-[0.8125rem] text-foreground-secondary flex-1">Cerrado</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="md" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={handleSaveSchedules}
          disabled={savingSchedules}
        >
          {savingSchedules ? "Guardando..." : "Guardar horarios"}
          {!savingSchedules && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </motion.div>,

    // Step 3: Services
    <motion.div
      key="services"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Agrega tus servicios</h2>
          <p className="text-[0.8125rem] text-foreground-secondary">Selecciona y ajusta precios</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-[360px] overflow-y-auto pr-1">
        {services.map((s, i) => (
          <label
            key={s.name}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              s.selected ? "border-primary/30 bg-primary/5" : "border-border bg-surface hover:bg-surface-alt"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                s.selected ? "bg-primary border-primary" : "border-border bg-surface"
              }`}
            >
              {s.selected && <Check className="w-3 h-3 text-white" />}
            </div>

            {/* Name */}
            <span className="flex-1 text-[0.875rem] font-medium text-foreground">
              {s.name}
            </span>

            {/* Price input */}
            <div className="flex items-center gap-1">
              <span className="text-[0.8125rem] text-foreground-secondary">S/</span>
              <input
                type="number"
                min={0}
                value={s.price}
                onChange={(e) => updateServicePrice(i, Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-8 px-2 bg-surface border border-border rounded-lg text-[0.8125rem] text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </label>
        ))}
      </div>

      <p className="text-[0.75rem] text-foreground-secondary mb-6">
        Puedes agregar más servicios después en Configuración
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" size="md" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={handleSaveServices}
          disabled={savingServices}
        >
          {savingServices
            ? "Guardando..."
            : services.some((s) => s.selected)
            ? "Agregar Seleccionados"
            : "Omitir"}
          {!savingServices && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </motion.div>,

    // Step 4: Done
    <motion.div
      key="done"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
      >
        <Check className="w-10 h-10 text-green-600" />
      </motion.div>

      <h2 className="text-2xl font-bold text-foreground mb-2">¡Todo listo!</h2>
      <p className="text-foreground-secondary mb-6">Tu clínica está configurada y lista para usar.</p>

      <div className="flex gap-4 justify-center mb-8">
        {schedulesCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[0.8125rem] font-medium text-foreground">
              {schedulesCount} {schedulesCount === 1 ? "horario" : "horarios"}
            </span>
          </div>
        )}
        {servicesCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-[0.8125rem] font-medium text-foreground">
              {servicesCount} {servicesCount === 1 ? "servicio" : "servicios"}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => {
          setVisible(false);
          navigate("/agenda");
        }}
      >
        <Calendar className="w-4 h-4 mr-2" />
        Ir a mi Agenda
      </Button>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto px-6 py-10">
        <StepIndicator current={step} total={4} />
        <AnimatePresence mode="wait" custom={direction}>
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}
