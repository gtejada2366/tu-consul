import { useState, useMemo } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Search,
  Calendar as CalendarIcon, Clock, User, X, FileText, AlertCircle,
  TrendingUp, Users, DollarSign
} from "lucide-react";
import { useAppointments, useWeekAppointments, useAppointmentMutations } from "../hooks/use-appointments";
import { useDashboard } from "../hooks/use-dashboard";
import { usePatients } from "../hooks/use-patients";
import { useClinicUsers, useClinicSchedules, useClinicServices } from "../hooks/use-clinic";
import { useAuth } from "../contexts/auth-context";
import { supabase } from "../lib/supabase";
import type { AppointmentWithRelations, ClinicService } from "../lib/types";
import { inputClass, labelClass, textareaClass } from "../components/modals/form-classes";
import { SearchableSelect } from "../components/ui/searchable-select";
import { APPOINTMENT_TYPES, DURATION_OPTIONS, STATUS_COLORS, STATUS_LABELS, generateTimeSlots, getTypeColor, TYPE_COLORS, toLocalDateStr, to12h } from "../lib/constants";

interface CompletionServiceLine {
  service_id: string | null;
  service_name: string;
  price: number;
  quantity: number;
}

function formatDate(date: Date): string { return toLocalDateStr(date); }
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

const WEEK_DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { appointments, loading, refetch } = useAppointments(formatDate(currentDate));
  const weekRange = getWeekRange(currentDate);
  const { appointments: weekAppointments, loading: weekLoading, refetch: refetchWeek } = useWeekAppointments(formatDate(weekRange.start), formatDate(weekRange.end));
  const { createAppointment, updateAppointment, cancelAppointment } = useAppointmentMutations();
  const { stats, canSeeRevenue } = useDashboard();
  const { patients } = usePatients();
  const { schedules } = useClinicSchedules();

  // Dynamic time slots from clinic schedule for current day of week
  const dayOfWeek = currentDate.getDay();
  const dbDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const todaySchedule = schedules.find(s => s.day_of_week === dbDayOfWeek && s.is_active);
  const timeSlots = generateTimeSlots(todaySchedule?.start_time?.slice(0, 5), todaySchedule?.end_time?.slice(0, 5));

  // Week days array for week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekRange.start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [view, setView] = useState<"day" | "week">("day");
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agendaSearch, setAgendaSearch] = useState("");
  const { users: clinicUsers } = useClinicUsers();
  const { services: clinicServicesList } = useClinicServices();
  const { clinic, user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const activeServices = useMemo(() => clinicServicesList.filter(s => s.is_active), [clinicServicesList]);
  const doctors = useMemo(() => clinicUsers.filter(u => u.role === "doctor" || u.role === "admin"), [clinicUsers]);
  const [aptForm, setAptForm] = useState({ patient_id: "", doctor_id: "", date: "", start_time: "09:00", duration_minutes: "30", type: "Consulta General", status: "pending", notes: "" });
  const [editForm, setEditForm] = useState({ date: "", start_time: "", duration_minutes: "", type: "", status: "", notes: "", doctor_id: "" });

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionApt, setCompletionApt] = useState<AppointmentWithRelations | null>(null);
  const [completionLines, setCompletionLines] = useState<CompletionServiceLine[]>([]);
  const [completionSaving, setCompletionSaving] = useState(false);

  // Drag & Drop state
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // "time:HH:MM" or "date:YYYY-MM-DD"

  function canDrag(apt: AppointmentWithRelations) {
    return apt.status !== "completed" && apt.status !== "cancelled";
  }

  function handleDragStart(e: React.DragEvent, apt: AppointmentWithRelations) {
    if (!canDrag(apt)) { e.preventDefault(); return; }
    setDraggedAptId(apt.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", apt.id);
    // Make ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedAptId(null);
    setDropTarget(null);
  }

  function handleDragOver(e: React.DragEvent, targetKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(targetKey);
  }

  function handleDragLeave() {
    setDropTarget(null);
  }

  async function handleDropOnTime(e: React.DragEvent, newTime: string) {
    e.preventDefault();
    setDropTarget(null);
    const aptId = e.dataTransfer.getData("text/plain");
    if (!aptId) return;
    const apt = appointments.find(a => a.id === aptId) || weekAppointments.find(a => a.id === aptId);
    if (!apt || apt.start_time?.slice(0, 5) === newTime) return;
    const overlaps = findOverlaps(apt.date, newTime, apt.duration_minutes || 30, aptId);
    const { error } = await updateAppointment(aptId, { start_time: newTime });
    if (error) { toast.error(error); }
    else {
      toast.success(`Cita movida a ${to12h(newTime)}`);
      if (overlaps.length > 0) toast.warning(`Se traslapa con ${overlaps.length} cita(s) existente(s)`);
      setSelectedAppointment(null); refetch(); refetchWeek();
    }
  }

  async function handleDropOnDay(e: React.DragEvent, newDate: string) {
    e.preventDefault();
    setDropTarget(null);
    const aptId = e.dataTransfer.getData("text/plain");
    if (!aptId) return;
    const apt = weekAppointments.find(a => a.id === aptId);
    if (!apt || apt.date === newDate) return;
    const overlaps = findOverlaps(newDate, apt.start_time?.slice(0, 5) || "09:00", apt.duration_minutes || 30, aptId);
    const { error } = await updateAppointment(aptId, { date: newDate });
    if (error) { toast.error(error); }
    else {
      toast.success(`Cita movida a ${new Date(newDate + "T00:00").toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}`);
      if (overlaps.length > 0) toast.warning(`Se traslapa con ${overlaps.length} cita(s) existente(s)`);
      setSelectedAppointment(null); refetch(); refetchWeek();
    }
  }

  function goToDay(offset: number) { const d = new Date(currentDate); d.setDate(d.getDate() + (view === "week" ? offset * 7 : offset)); setCurrentDate(d); setSelectedAppointment(null); }
  function goToToday() { setCurrentDate(new Date()); setSelectedAppointment(null); }

  /** Check if a proposed appointment overlaps with existing ones */
  function findOverlaps(date: string, startTime: string, durationMin: number, excludeId?: string) {
    const allApts = view === "day" ? appointments : weekAppointments;
    const newStart = timeToMin(startTime);
    const newEnd = newStart + durationMin;
    return allApts.filter(a => {
      if (a.date !== date) return false;
      if (a.status === "cancelled") return false;
      if (excludeId && a.id === excludeId) return false;
      const aStart = timeToMin(a.start_time?.slice(0, 5) || "00:00");
      const aEnd = aStart + (a.duration_minutes || 30);
      return newStart < aEnd && newEnd > aStart;
    });
  }

  function timeToMin(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function openCreateModal(time?: string, date?: string) {
    setAptForm({ patient_id: "", doctor_id: "", date: date || formatDate(currentDate), start_time: time || "09:00", duration_minutes: "30", type: "Consulta General", status: "pending", notes: "" });
    setShowCreateModal(true);
  }

  function openEditModal() {
    if (!selectedAppointment) return;
    setEditForm({
      date: selectedAppointment.date, start_time: selectedAppointment.start_time?.slice(0, 5) || "",
      duration_minutes: String(selectedAppointment.duration_minutes), type: selectedAppointment.type,
      status: selectedAppointment.status, notes: selectedAppointment.notes || "",
      doctor_id: selectedAppointment.doctor_id || "",
    });
    setShowEditModal(true);
  }

  const [overlapConfirmed, setOverlapConfirmed] = useState(false);

  async function handleCreateApt(e: React.FormEvent) {
    e.preventDefault();
    if (!aptForm.patient_id || !aptForm.type) { toast.error("Paciente y tipo son obligatorios"); return; }

    // Check for overlaps and require confirmation
    const overlaps = findOverlaps(aptForm.date, aptForm.start_time, parseInt(aptForm.duration_minutes));
    if (overlaps.length > 0 && !overlapConfirmed) {
      setOverlapConfirmed(true);
      toast.warning("Hay citas en este horario. Presiona 'Crear Cita' de nuevo para confirmar.");
      return;
    }

    setSaving(true);
    const { error } = await createAppointment({
      patient_id: aptForm.patient_id, doctor_id: aptForm.doctor_id || undefined, date: aptForm.date, start_time: aptForm.start_time,
      duration_minutes: parseInt(aptForm.duration_minutes), type: aptForm.type, status: aptForm.status,
      notes: aptForm.notes || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Cita creada"); setShowCreateModal(false); setOverlapConfirmed(false); refetch(); refetchWeek(); }
  }

  async function handleEditApt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppointment) return;

    // If changing to completed, open completion modal instead
    if (editForm.status === "completed" && selectedAppointment.status !== "completed") {
      setShowEditModal(false);
      openCompletionModal(selectedAppointment);
      return;
    }

    setSaving(true);
    const { error } = await updateAppointment(selectedAppointment.id, {
      date: editForm.date, start_time: editForm.start_time,
      duration_minutes: parseInt(editForm.duration_minutes), type: editForm.type,
      status: editForm.status, notes: editForm.notes || null,
      doctor_id: editForm.doctor_id || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Cita actualizada"); setShowEditModal(false); setSelectedAppointment(null); refetch(); refetchWeek(); }
  }

  function openCompletionModal(apt: AppointmentWithRelations) {
    setCompletionApt(apt);
    setCompletionLines([{ service_id: null, service_name: "", price: 0, quantity: 1 }]);
    setShowCompletionModal(true);
  }

  function addCompletionLine() {
    setCompletionLines(prev => [...prev, { service_id: null, service_name: "", price: 0, quantity: 1 }]);
  }

  function removeCompletionLine(index: number) {
    setCompletionLines(prev => prev.filter((_, i) => i !== index));
  }

  function updateCompletionLine(index: number, field: keyof CompletionServiceLine, value: string | number) {
    setCompletionLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      if (field === "service_id") {
        const svc = activeServices.find(s => s.id === value);
        if (svc) return { ...line, service_id: svc.id, service_name: svc.name, price: Number(svc.price) };
        return { ...line, service_id: null, service_name: "", price: 0 };
      }
      return { ...line, [field]: value };
    }));
  }

  const completionTotal = completionLines.reduce((sum, l) => sum + (l.price * l.quantity), 0);

  async function handleCompleteAppointment() {
    if (!completionApt || !clinic) return;
    const validLines = completionLines.filter(l => l.service_name.trim());
    if (validLines.length === 0) { toast.error("Agrega al menos un servicio realizado"); return; }

    setCompletionSaving(true);

    // 1. Mark appointment as completed
    const { error: aptError } = await updateAppointment(completionApt.id, { status: "completed" });
    if (aptError) { toast.error(aptError); setCompletionSaving(false); return; }

    // 2. Insert appointment_services
    const { error: svcError } = await supabase
      .from("appointment_services")
      .insert(validLines.map(l => ({
        appointment_id: completionApt.id,
        clinic_id: clinic.id,
        service_id: l.service_id,
        service_name: l.service_name,
        price: l.price,
        quantity: l.quantity,
      })) as Record<string, unknown>[]);

    if (svcError) { toast.error("Cita completada pero hubo un error al guardar los servicios"); }

    setCompletionSaving(false);
    toast.success("Cita completada con servicios registrados");
    setShowCompletionModal(false);
    setCompletionApt(null);
    setSelectedAppointment(null);
    refetch();
    refetchWeek();
  }

  async function handleCancelApt() {
    if (!selectedAppointment) return;
    setSaving(true);
    const { error } = await cancelAppointment(selectedAppointment.id);
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Cita cancelada"); setShowCancelModal(false); setSelectedAppointment(null); refetch(); refetchWeek(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Agenda</h1>
            {!headerCollapsed && <p className="text-[0.875rem] text-foreground-secondary mt-1">Gestiona tus citas y horarios</p>}
          </div>
          <button
            onClick={() => setHeaderCollapsed(prev => !prev)}
            className="p-1.5 rounded-lg hover:bg-surface-alt text-foreground-secondary hover:text-foreground transition-colors"
            title={headerCollapsed ? "Mostrar resumen" : "Ocultar resumen"}
          >
            {headerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
        <Button variant="primary" size="md" onClick={() => openCreateModal()}><Plus className="w-4 h-4 mr-2" />Nueva Cita</Button>
      </div>

      {/* KPI Cards — collapsible */}
      {!headerCollapsed && (
        <div className={`grid grid-cols-2 ${canSeeRevenue ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
          <Card>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-medium text-foreground-secondary mb-1">Citas Hoy</p>
                <p className="text-[1.5rem] font-semibold text-foreground leading-none">{stats.appointments_today}</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-medium text-foreground-secondary mb-1">% Atendidos</p>
                <p className="text-[1.5rem] font-semibold text-foreground leading-none">{stats.occupancy_pct}%</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-success/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-medium text-foreground-secondary mb-1">Atendidos</p>
                <p className="text-[1.5rem] font-semibold text-foreground leading-none">{stats.patients_attended}</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-warning" />
              </div>
            </div>
          </Card>
          {canSeeRevenue && (
            <Card>
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.6875rem] font-medium text-foreground-secondary mb-1">Ingresos Hoy</p>
                  <p className="text-[1.5rem] font-semibold text-foreground leading-none">S/{stats.revenue_today.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card><CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => goToDay(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="flex items-center gap-2 h-10 px-2">
              <CalendarIcon className="w-4 h-4 text-foreground-secondary flex-shrink-0 hidden sm:block" />
              <span className="font-semibold text-foreground text-[0.8125rem] sm:text-[0.875rem] leading-none">{view === "week" ? `${weekRange.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${weekRange.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : formatDisplayDate(currentDate)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => goToDay(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-alt rounded-[10px] p-1">
              <button onClick={() => setView("day")} className={`px-3 py-1.5 text-[0.75rem] font-medium rounded-[8px] transition-all ${view === "day" ? "bg-surface text-foreground shadow-sm" : "text-foreground-secondary hover:text-foreground"}`}>Día</button>
              <button onClick={() => setView("week")} className={`px-3 py-1.5 text-[0.75rem] font-medium rounded-[8px] transition-all ${view === "week" ? "bg-surface text-foreground shadow-sm" : "text-foreground-secondary hover:text-foreground"}`}>Semana</button>
            </div>
            <Button variant="tertiary" size="sm" onClick={goToToday}>Hoy</Button>
          </div>
        </div>
      </CardContent></Card>

      {/* Type legend — always visible */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        {APPOINTMENT_TYPES.filter(t => !["Limpieza", "Ortodoncia", "Endodoncia"].includes(t)).map(t => {
          const tc = getTypeColor(t);
          return (
            <div key={t} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${tc.dot} flex-shrink-0`} />
              <span className="text-[0.6875rem] text-foreground-secondary">{t}</span>
            </div>
          );
        })}
      </div>

      <div>
        <Card><CardContent className="p-0">
          {(view === "day" ? loading : weekLoading) ? <Loading /> : view === "day" ? (
            /* ===== DAY VIEW ===== */
            <div className="overflow-y-auto max-h-[600px]">
              <div className="relative">
                <div className="sticky top-0 bg-surface z-10 border-b border-border p-4">
                  <div className="flex items-center gap-2"><Search className="w-4 h-4 text-foreground-secondary" />
                    <input type="text" placeholder="Buscar paciente o cita..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)} className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
                  </div>
                </div>
                {agendaSearch.trim() && appointments.filter(a => {
                  const q = agendaSearch.toLowerCase();
                  return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                }).length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-foreground-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-[0.875rem] text-foreground-secondary">No se encontraron citas con "{agendaSearch}"</p>
                  </div>
                )}
                <div className="p-4 space-y-0">
                  {/* Group time slots into 1-hour blocks with two 30-min sub-rows */}
                  {(() => {
                    const hourBlocks: { hour: string; slots: string[] }[] = [];
                    for (const time of timeSlots) {
                      const isHalf = time.endsWith(":30");
                      if (!isHalf) {
                        hourBlocks.push({ hour: time, slots: [time] });
                      } else if (hourBlocks.length > 0) {
                        hourBlocks[hourBlocks.length - 1].slots.push(time);
                      } else {
                        hourBlocks.push({ hour: time, slots: [time] });
                      }
                    }
                    return hourBlocks.map(({ hour, slots }) => (
                      <div key={hour} className="flex border-b border-border last:border-0">
                        {/* Hour label spanning the full block */}
                        <div className="w-16 py-2 text-[0.75rem] text-foreground-secondary font-medium cursor-pointer hover:text-primary transition-colors flex-shrink-0" onClick={() => openCreateModal(hour)}>
                          {to12h(hour)}
                        </div>
                        {/* Sub-rows for each 30-min slot */}
                        <div className="flex-1">
                          {slots.map((time, slotIdx) => {
                            const slotApts = appointments.filter(a => {
                              if (a.start_time?.slice(0, 5) !== time) return false;
                              if (!agendaSearch.trim()) return true;
                              const q = agendaSearch.toLowerCase();
                              return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                            });
                            const isDropTarget = dropTarget === `time:${time}`;
                            const isHalf = slotIdx > 0;
                            return (
                              <div key={time}
                                className={`py-1 transition-colors ${isDropTarget ? "bg-primary/10" : ""} ${isHalf ? "border-t border-dashed border-border/50" : ""}`}
                                onDragOver={e => handleDragOver(e, `time:${time}`)} onDragLeave={handleDragLeave} onDrop={e => handleDropOnTime(e, time)}>
                                {slotApts.map((apt) => {
                                  const tc = getTypeColor(apt.type);
                                  return (
                                    <div key={apt.id} draggable={canDrag(apt)} onDragStart={e => handleDragStart(e, apt)} onDragEnd={handleDragEnd}
                                      onClick={() => setSelectedAppointment(apt)}
                                      className={`mb-1 p-2.5 rounded-[10px] border-l-4 transition-all duration-150 ${tc.bg} ${tc.border}
                                        ${canDrag(apt) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                                        ${draggedAptId === apt.id ? "opacity-50" : ""}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-foreground text-[0.8125rem] truncate">{apt.patient?.full_name || "-"}</p>
                                          <p className="text-[0.6875rem] text-foreground-secondary mt-0.5">{to12h(time)} • {apt.type}{!isDoctor && ` • ${apt.doctor?.full_name?.startsWith("Dr.") ? apt.doctor.full_name : `Dr. ${apt.doctor?.full_name || "-"}`}`}</p>
                                        </div>
                                        <Badge variant={STATUS_COLORS[apt.status]}>{STATUS_LABELS[apt.status]}</Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                                {slotApts.length === 0 && (
                                  <div onClick={() => openCreateModal(time)}
                                    className={`h-7 rounded-[6px] cursor-pointer hover:bg-surface-alt transition-colors ${isDropTarget ? "border-2 border-dashed border-primary" : ""}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* ===== WEEK VIEW ===== */
            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
                {/* Search */}
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-2"><Search className="w-4 h-4 text-foreground-secondary" />
                    <input type="text" placeholder="Buscar paciente o cita..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)} className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
                  </div>
                </div>
                {agendaSearch.trim() && weekAppointments.filter(a => {
                  const q = agendaSearch.toLowerCase();
                  return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                }).length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-foreground-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-[0.875rem] text-foreground-secondary">No se encontraron citas con "{agendaSearch}"</p>
                  </div>
                )}
                {/* Header: hour col + 7 day columns */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-surface z-10">
                  <div className="border-r border-border" />
                  {weekDays.map((d) => {
                    const dateStr = formatDate(d);
                    const dayIdx = weekDays.indexOf(d);
                    const isToday = dateStr === formatDate(new Date());
                    const isSelected = dateStr === formatDate(currentDate);
                    return (
                      <button key={dateStr} onClick={() => { setCurrentDate(new Date(d)); setView("day"); }}
                        className={`py-3 text-center border-r border-border last:border-r-0 transition-colors hover:bg-surface-alt
                          ${isToday ? "bg-primary/5" : ""} ${isSelected ? "bg-primary/10" : ""}`}>
                        <p className="text-[0.6875rem] font-medium text-foreground-secondary">{WEEK_DAY_NAMES[dayIdx]}</p>
                        <p className={`text-[1rem] font-semibold mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
                      </button>
                    );
                  })}
                </div>
                {/* Time grid: 1-hour blocks with 30-min sub-rows × day columns */}
                <div className="overflow-y-auto max-h-[500px]">
                  {(() => {
                    const hourBlocks: { hour: string; slots: string[] }[] = [];
                    for (const time of timeSlots) {
                      const isHalf = time.endsWith(":30");
                      if (!isHalf) {
                        hourBlocks.push({ hour: time, slots: [time] });
                      } else if (hourBlocks.length > 0) {
                        hourBlocks[hourBlocks.length - 1].slots.push(time);
                      } else {
                        hourBlocks.push({ hour: time, slots: [time] });
                      }
                    }
                    return hourBlocks.map(({ hour, slots }) => (
                      <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-0">
                        {/* Hour label spanning the full block */}
                        <div className="border-r border-border py-1 px-1 text-[0.6875rem] text-foreground-secondary font-medium text-right pr-2">
                          {to12h(hour)}
                        </div>
                        {/* Day columns, each with sub-rows for 30-min slots */}
                        {weekDays.map((d) => {
                          const dateStr = formatDate(d);
                          const isToday = dateStr === formatDate(new Date());
                          const isDayDropTarget = dropTarget === `date:${dateStr}`;
                          return (
                            <div key={dateStr} className={`border-r border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""} ${isDayDropTarget ? "bg-primary/15" : ""}`}
                              onDragOver={e => handleDragOver(e, `date:${dateStr}`)} onDragLeave={handleDragLeave} onDrop={e => handleDropOnDay(e, dateStr)}>
                              {slots.map((time, slotIdx) => {
                                const isHalf = slotIdx > 0;
                                const slotApts = weekAppointments.filter(a => {
                                  if (a.date !== dateStr || a.start_time?.slice(0, 5) !== time) return false;
                                  if (!agendaSearch.trim()) return true;
                                  const q = agendaSearch.toLowerCase();
                                  return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                                });
                                return (
                                  <div key={time}
                                    className={`p-0.5 min-h-[28px] transition-colors cursor-pointer ${isHalf ? "border-t border-dashed border-border/50" : ""} ${slotApts.length === 0 ? "hover:bg-surface-alt" : ""}`}
                                    onClick={() => { if (slotApts.length === 0) openCreateModal(time, dateStr); }}>
                                    {slotApts.map(apt => {
                                      const tc = getTypeColor(apt.type);
                                      return (
                                        <div key={apt.id} draggable={canDrag(apt)} onDragStart={e => handleDragStart(e, apt)} onDragEnd={handleDragEnd}
                                          onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                          className={`p-1.5 rounded-[6px] border-l-3 transition-all duration-150 text-left ${tc.bg} ${tc.border}
                                            ${canDrag(apt) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                                            ${draggedAptId === apt.id ? "opacity-50" : ""} mb-0.5`}>
                                          <p className="text-[0.625rem] font-semibold text-foreground truncate">{apt.patient?.full_name || "-"}</p>
                                          <p className="text-[0.5625rem] text-foreground-secondary truncate">{to12h(time)} • {apt.type}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent></Card>
      </div>

      {/* Appointment Detail Modal */}
      <Modal open={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title="Detalle de Cita" size="sm">
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Paciente</p><p className="font-semibold text-foreground">{selectedAppointment.patient?.full_name || "-"}</p></div></div>
              {!isDoctor && <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Doctor</p><p className="font-semibold text-foreground">{selectedAppointment.doctor?.full_name || "-"}</p></div></div>}
              <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Horario</p><p className="font-semibold text-foreground">{to12h(selectedAppointment.start_time)} ({selectedAppointment.duration_minutes} min)</p></div></div>
              <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><CalendarIcon className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Tipo</p><p className="font-semibold text-foreground">{selectedAppointment.type}</p></div></div>
              {selectedAppointment.notes && (
                <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Notas</p><p className="text-[0.875rem] text-foreground">{selectedAppointment.notes}</p></div></div>
              )}
            </div>

            {/* Current status + Change status */}
            <div className="pt-3 border-t border-border">
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Estado actual</p>
              <Badge variant={STATUS_COLORS[selectedAppointment.status]} className="mb-4">{STATUS_LABELS[selectedAppointment.status]}</Badge>

              {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Cambiar estado</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAppointment.status !== "confirmed" && (
                      <Button variant="tertiary" size="sm" className="w-full" onClick={async () => {
                        const { error } = await updateAppointment(selectedAppointment.id, { status: "confirmed" });
                        if (error) toast.error(error);
                        else { toast.success("Cita confirmada"); setSelectedAppointment(null); refetch(); refetchWeek(); }
                      }}>Confirmar</Button>
                    )}
                    {selectedAppointment.status !== "in_transit" && (
                      <Button variant="tertiary" size="sm" className="w-full" onClick={async () => {
                        const { error } = await updateAppointment(selectedAppointment.id, { status: "in_transit" });
                        if (error) toast.error(error);
                        else { toast.success("Paciente en camino"); setSelectedAppointment(null); refetch(); refetchWeek(); }
                      }}>En Camino</Button>
                    )}
                    {selectedAppointment.status !== "in_progress" && (
                      <Button variant="tertiary" size="sm" className="w-full" onClick={async () => {
                        const { error } = await updateAppointment(selectedAppointment.id, { status: "in_progress" });
                        if (error) toast.error(error);
                        else { toast.success("Paciente en consulta"); setSelectedAppointment(null); refetch(); refetchWeek(); }
                      }}>En Consulta</Button>
                    )}
                    <Button variant="primary" size="sm" className="w-full" onClick={() => {
                      setSelectedAppointment(null);
                      openCompletionModal(selectedAppointment);
                    }}>Completar</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <Button variant="tertiary" className="w-full" onClick={openEditModal}>Reprogramar / Editar Cita</Button>
              {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                <Button variant="danger" className="w-full" onClick={() => setShowCancelModal(true)}>Cancelar Cita</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Appointment Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva Cita" size="md">
        <form onSubmit={handleCreateApt} className="space-y-4">
          <div>
            <label className={labelClass}>Paciente *</label>
            <SearchableSelect
              placeholder="Seleccionar paciente"
              options={patients.filter(p => p.status === "active").map(p => ({ value: p.id, label: p.full_name }))}
              value={aptForm.patient_id}
              onChange={v => setAptForm({ ...aptForm, patient_id: v })}
            />
          </div>
          {!isDoctor && (
            <div>
              <label className={labelClass}>Doctor / Especialista</label>
              <select className={inputClass} value={aptForm.doctor_id} onChange={e => setAptForm({ ...aptForm, doctor_id: e.target.value })}>
                <option value="">Yo mismo (por defecto)</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Fecha *</label><input type="date" className={inputClass} value={aptForm.date} onChange={e => { setAptForm({ ...aptForm, date: e.target.value }); setOverlapConfirmed(false); }} /></div>
            <div><label className={labelClass}>Hora *</label>
              <select className={inputClass} value={aptForm.start_time} onChange={e => { setAptForm({ ...aptForm, start_time: e.target.value }); setOverlapConfirmed(false); }}>
                {timeSlots.map(t => <option key={t} value={t}>{to12h(t)}</option>)}
              </select>
            </div>
          </div>
          {/* Overlap warning */}
          {aptForm.date && aptForm.start_time && (() => {
            const overlaps = findOverlaps(aptForm.date, aptForm.start_time, parseInt(aptForm.duration_minutes));
            if (overlaps.length === 0) return null;
            return (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-[0.8125rem]">
                  <p className="font-medium">Conflicto de horario</p>
                  <p className="mt-0.5 text-[0.75rem]">{overlaps.length === 1 ? "Ya existe 1 cita" : `Ya existen ${overlaps.length} citas`} en este horario: {overlaps.map(a => a.patient?.full_name || "—").join(", ")}</p>
                </div>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Tipo de Cita *</label>
              <select className={inputClass} value={aptForm.type} onChange={e => setAptForm({ ...aptForm, type: e.target.value })}>
                {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className={labelClass}>Duración</label>
              <select className={inputClass} value={aptForm.duration_minutes} onChange={e => { setAptForm({ ...aptForm, duration_minutes: e.target.value }); setOverlapConfirmed(false); }}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select></div>
          </div>
          <div><label className={labelClass}>Estado</label>
            <select className={inputClass} value={aptForm.status} onChange={e => setAptForm({ ...aptForm, status: e.target.value })}>
              <option value="pending">Por confirmar</option><option value="confirmed">Confirmada</option><option value="in_transit">En camino</option>
            </select></div>
          <div><label className={labelClass}>Notas</label><textarea className={textareaClass} placeholder="Notas adicionales..." value={aptForm.notes} onChange={e => setAptForm({ ...aptForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowCreateModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Creando..." : "Crear Cita"}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Cita" size="md">
        <form onSubmit={handleEditApt} className="space-y-4">
          {!isDoctor && (
            <div>
              <label className={labelClass}>Doctor / Especialista</label>
              <select className={inputClass} value={editForm.doctor_id} onChange={e => setEditForm({ ...editForm, doctor_id: e.target.value })}>
                <option value="">Sin cambio</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Fecha</label><input type="date" className={inputClass} value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} /></div>
            <div><label className={labelClass}>Hora</label>
              <select className={inputClass} value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}>
                {timeSlots.map(t => <option key={t} value={t}>{to12h(t)}</option>)}
              </select>
            </div>
          </div>
          {/* Overlap warning */}
          {editForm.date && editForm.start_time && (() => {
            const overlaps = findOverlaps(editForm.date, editForm.start_time, parseInt(editForm.duration_minutes || "30"), selectedAppointment?.id);
            if (overlaps.length === 0) return null;
            return (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-[0.8125rem]">
                  <p className="font-medium">Conflicto de horario</p>
                  <p className="mt-0.5 text-[0.75rem]">{overlaps.length === 1 ? "Ya existe 1 cita" : `Ya existen ${overlaps.length} citas`} en este horario: {overlaps.map(a => a.patient?.full_name || "—").join(", ")}</p>
                </div>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Tipo de Cita</label>
              <select className={inputClass} value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className={labelClass}>Estado</label>
              <select className={inputClass} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="pending">Por confirmar</option><option value="confirmed">Confirmada</option><option value="in_transit">En camino</option><option value="in_progress">En consulta</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option>
              </select></div>
          </div>
          <div><label className={labelClass}>Duración</label>
            <select className={inputClass} value={editForm.duration_minutes} onChange={e => setEditForm({ ...editForm, duration_minutes: e.target.value })}>
              {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select></div>
          <div><label className={labelClass}>Notas</label><textarea className={textareaClass} placeholder="Notas..." value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowEditModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar Cambios"}</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Appointment Modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Cita" size="sm">
        <div className="space-y-4">
          <p className="text-[0.875rem] text-foreground-secondary">¿Cancelar la cita de <strong className="text-foreground">{selectedAppointment?.patient?.full_name}</strong> el {selectedAppointment?.date ? selectedAppointment.date.split("-").reverse().join("/") : ""} a las {to12h(selectedAppointment?.start_time)}?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowCancelModal(false)}>No, mantener</Button>
            <Button variant="danger" size="md" onClick={handleCancelApt} disabled={saving}>{saving ? "Cancelando..." : "Sí, cancelar"}</Button>
          </div>
        </div>
      </Modal>

      {/* Completion Modal — Services performed */}
      <Modal open={showCompletionModal} onClose={() => setShowCompletionModal(false)} title="Completar Cita — Servicios Realizados" size="lg">
        {completionApt && (
          <div className="space-y-4">
            <div className="p-3 bg-surface-alt rounded-[10px]">
              <p className="text-[0.875rem] font-semibold text-foreground">{completionApt.patient?.full_name}</p>
              <p className="text-[0.75rem] text-foreground-secondary">{completionApt.type} • {to12h(completionApt.start_time)} • {completionApt.doctor?.full_name?.startsWith("Dr.") ? completionApt.doctor.full_name : `Dr. ${completionApt.doctor?.full_name || "-"}`}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[0.875rem] font-semibold text-foreground">Servicios realizados</p>
                <Button variant="tertiary" size="sm" onClick={addCompletionLine}>
                  <Plus className="w-4 h-4 mr-1" />Agregar
                </Button>
              </div>

              {/* Header */}
              <div className="hidden md:grid grid-cols-[1fr_100px_60px_80px_32px] gap-2 px-1">
                <span className="text-[0.6875rem] font-medium text-foreground-secondary">Servicio</span>
                <span className="text-[0.6875rem] font-medium text-foreground-secondary">Precio (S/)</span>
                <span className="text-[0.6875rem] font-medium text-foreground-secondary">Cant.</span>
                <span className="text-[0.6875rem] font-medium text-foreground-secondary text-right">Subtotal</span>
                <span />
              </div>

              {completionLines.map((line, idx) => (
                <div key={`line-${idx}`} className="grid grid-cols-1 md:grid-cols-[1fr_100px_60px_80px_32px] gap-2 items-center p-2 bg-surface-alt rounded-[10px]">
                  <select className={inputClass} value={line.service_id || ""}
                    onChange={e => updateCompletionLine(idx, "service_id", e.target.value)}>
                    <option value="">Seleccionar servicio...</option>
                    {activeServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — S/{Number(s.price).toFixed(2)}</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" min="0" className={inputClass} placeholder="0.00"
                    value={line.price || ""} onChange={e => updateCompletionLine(idx, "price", parseFloat(e.target.value) || 0)} />
                  <input type="number" min="1" className={inputClass}
                    value={line.quantity} onChange={e => updateCompletionLine(idx, "quantity", parseInt(e.target.value) || 1)} />
                  <p className="text-[0.875rem] font-semibold text-foreground text-right">
                    S/{(line.price * line.quantity).toFixed(2)}
                  </p>
                  {completionLines.length > 1 && (
                    <button type="button" onClick={() => removeCompletionLine(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger/10 text-foreground-secondary hover:text-danger transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[10px] border border-primary/20">
              <span className="text-[0.875rem] font-semibold text-foreground">Total</span>
              <span className="text-[1.25rem] font-bold text-primary">S/{completionTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="tertiary" size="md" onClick={() => setShowCompletionModal(false)}>Cancelar</Button>
              <Button variant="primary" size="md" onClick={handleCompleteAppointment} disabled={completionSaving}>
                {completionSaving ? "Guardando..." : "Completar Cita"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
