import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import {
  ChevronLeft, ChevronRight, Plus, Search,
  Calendar as CalendarIcon, Clock, User, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppointments, useWeekAppointments, useAppointmentMutations } from "../hooks/use-appointments";
import { usePatients } from "../hooks/use-patients";
import { useClinicUsers, useClinicSchedules } from "../hooks/use-clinic";
import type { AppointmentWithRelations } from "../lib/types";
import { inputClass, labelClass, textareaClass } from "../components/modals/form-classes";
import { APPOINTMENT_TYPES, DURATION_OPTIONS, STATUS_COLORS, STATUS_LABELS, generateTimeSlots } from "../lib/constants";

function formatDate(date: Date): string { return date.toISOString().split("T")[0]; }
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agendaSearch, setAgendaSearch] = useState("");
  const { users: clinicUsers } = useClinicUsers();
  const doctors = clinicUsers.filter(u => u.role === "doctor" || u.role === "admin");
  const [aptForm, setAptForm] = useState({ patient_id: "", doctor_id: "", date: "", start_time: "09:00", duration_minutes: "30", type: "Consulta General", notes: "" });
  const [editForm, setEditForm] = useState({ date: "", start_time: "", duration_minutes: "", type: "", status: "", notes: "", doctor_id: "" });

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
    const { error } = await updateAppointment(aptId, { start_time: newTime });
    if (error) { toast.error(error); }
    else { toast.success(`Cita movida a ${newTime}`); setSelectedAppointment(null); refetch(); refetchWeek(); }
  }

  async function handleDropOnDay(e: React.DragEvent, newDate: string) {
    e.preventDefault();
    setDropTarget(null);
    const aptId = e.dataTransfer.getData("text/plain");
    if (!aptId) return;
    const apt = weekAppointments.find(a => a.id === aptId);
    if (!apt || apt.date === newDate) return;
    const { error } = await updateAppointment(aptId, { date: newDate });
    if (error) { toast.error(error); }
    else { toast.success(`Cita movida a ${new Date(newDate + "T00:00").toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}`); setSelectedAppointment(null); refetch(); refetchWeek(); }
  }

  function goToDay(offset: number) { const d = new Date(currentDate); d.setDate(d.getDate() + (view === "week" ? offset * 7 : offset)); setCurrentDate(d); setSelectedAppointment(null); }
  function goToToday() { setCurrentDate(new Date()); setSelectedAppointment(null); }

  function openCreateModal() {
    setAptForm({ patient_id: "", doctor_id: "", date: formatDate(currentDate), start_time: "09:00", duration_minutes: "30", type: "Consulta General", notes: "" });
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

  async function handleCreateApt(e: React.FormEvent) {
    e.preventDefault();
    if (!aptForm.patient_id || !aptForm.type) { toast.error("Paciente y tipo son obligatorios"); return; }
    setSaving(true);
    const { error } = await createAppointment({
      patient_id: aptForm.patient_id, doctor_id: aptForm.doctor_id || undefined, date: aptForm.date, start_time: aptForm.start_time,
      duration_minutes: parseInt(aptForm.duration_minutes), type: aptForm.type,
      notes: aptForm.notes || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Cita creada"); setShowCreateModal(false); refetch(); refetchWeek(); }
  }

  async function handleEditApt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppointment) return;
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
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Agenda</h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">Gestiona tus citas y horarios</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />Nueva Cita</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => goToDay(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-foreground-secondary hidden sm:block" /><span className="font-semibold text-foreground capitalize text-[0.8125rem] sm:text-[0.875rem]">{view === "week" ? `${weekRange.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${weekRange.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : formatDisplayDate(currentDate)}</span></div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardContent className="p-0">
          {(view === "day" ? loading : weekLoading) ? <Loading /> : view === "day" ? (
            /* ===== DAY VIEW ===== */
            <div className="overflow-y-auto max-h-[600px]">
              <div className="relative">
                <div className="sticky top-0 bg-surface z-10 border-b border-border p-4">
                  <div className="flex items-center gap-2"><Search className="w-4 h-4 text-foreground-secondary" />
                    <input type="text" placeholder="Buscar paciente o cita..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)} className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
                  </div>
                </div>
                <div className="p-4 space-y-0">
                  {timeSlots.map((time) => {
                    const slotApts = appointments.filter(a => {
                      if (a.start_time?.slice(0, 5) !== time) return false;
                      if (!agendaSearch.trim()) return true;
                      const q = agendaSearch.toLowerCase();
                      return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                    });
                    const isDropTarget = dropTarget === `time:${time}`;
                    return (
                      <div key={time} className={`flex border-b border-border last:border-0 transition-colors ${isDropTarget ? "bg-primary/10" : ""}`}
                        onDragOver={e => handleDragOver(e, `time:${time}`)} onDragLeave={handleDragLeave} onDrop={e => handleDropOnTime(e, time)}>
                        <div className="w-16 py-3 text-[0.75rem] text-foreground-secondary font-medium">{time}</div>
                        <div className="flex-1 py-2 relative">
                          {slotApts.map((apt) => (
                            <div key={apt.id} draggable={canDrag(apt)} onDragStart={e => handleDragStart(e, apt)} onDragEnd={handleDragEnd}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`mb-2 p-3 rounded-[10px] border-l-4 transition-all duration-150
                                ${canDrag(apt) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                                ${draggedAptId === apt.id ? "opacity-50" : ""}
                                ${apt.status === "confirmed" && "bg-success/10 border-success"}
                                ${apt.status === "pending" && "bg-warning/10 border-warning"}
                                ${apt.status === "in_transit" && "bg-warning/10 border-warning"}
                                ${apt.status === "in_progress" && "bg-success/10 border-success"}
                                ${apt.status === "completed" && "bg-primary/10 border-primary"}
                                ${apt.status === "cancelled" && "bg-danger/10 border-danger"}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground text-[0.875rem] truncate">{apt.patient?.full_name || "-"}</p>
                                  <p className="text-[0.75rem] text-foreground-secondary mt-0.5">{apt.type} • Dr. {apt.doctor?.full_name || "-"}</p>
                                </div>
                                <Badge variant={STATUS_COLORS[apt.status]}>{STATUS_LABELS[apt.status]}</Badge>
                              </div>
                            </div>
                          ))}
                          {slotApts.length === 0 && <div className={`h-12 rounded-[8px] ${isDropTarget ? "border-2 border-dashed border-primary" : ""}`}></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ===== WEEK VIEW ===== */
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Week header */}
                <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-surface z-10">
                  {weekDays.map((d, i) => {
                    const isToday = formatDate(d) === formatDate(new Date());
                    const isSelected = formatDate(d) === formatDate(currentDate);
                    return (
                      <button key={i} onClick={() => { setCurrentDate(new Date(d)); setView("day"); }}
                        className={`py-3 text-center border-r border-border last:border-r-0 transition-colors hover:bg-surface-alt
                          ${isToday ? "bg-primary/5" : ""} ${isSelected ? "bg-primary/10" : ""}`}>
                        <p className="text-[0.6875rem] font-medium text-foreground-secondary">{WEEK_DAY_NAMES[i]}</p>
                        <p className={`text-[1rem] font-semibold mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>
                          {d.getDate()}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {/* Week body */}
                <div className="grid grid-cols-7 min-h-[400px]">
                  {weekDays.map((d, i) => {
                    const dateStr = formatDate(d);
                    const dayApts = weekAppointments
                      .filter(a => a.date === dateStr)
                      .filter(a => {
                        if (!agendaSearch.trim()) return true;
                        const q = agendaSearch.toLowerCase();
                        return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                      });
                    const isToday = dateStr === formatDate(new Date());
                    const isDayDropTarget = dropTarget === `date:${dateStr}`;
                    return (
                      <div key={i} className={`border-r border-border last:border-r-0 p-1.5 space-y-1 transition-colors
                        ${isToday ? "bg-primary/5" : ""} ${isDayDropTarget ? "bg-primary/15 ring-2 ring-inset ring-primary/30" : ""}`}
                        onDragOver={e => handleDragOver(e, `date:${dateStr}`)} onDragLeave={handleDragLeave} onDrop={e => handleDropOnDay(e, dateStr)}>
                        {dayApts.length > 0 ? dayApts.map(apt => (
                          <div key={apt.id} draggable={canDrag(apt)} onDragStart={e => handleDragStart(e, apt)} onDragEnd={handleDragEnd}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`p-2 rounded-[8px] border-l-3 transition-all duration-150 text-left
                              ${canDrag(apt) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                              ${draggedAptId === apt.id ? "opacity-50" : ""}
                              ${apt.status === "confirmed" && "bg-success/10 border-success"}
                              ${apt.status === "pending" && "bg-warning/10 border-warning"}
                              ${apt.status === "in_transit" && "bg-warning/10 border-warning"}
                              ${apt.status === "in_progress" && "bg-success/10 border-success"}
                              ${apt.status === "completed" && "bg-primary/10 border-primary"}
                              ${apt.status === "cancelled" && "bg-danger/10 border-danger"}`}>
                            <p className="text-[0.6875rem] font-semibold text-foreground truncate">{apt.patient?.full_name || "-"}</p>
                            <p className="text-[0.625rem] text-foreground-secondary">{apt.start_time?.slice(0, 5)}</p>
                            <p className="text-[0.5625rem] text-foreground-secondary truncate">{apt.type}</p>
                          </div>
                        )) : (
                          <p className={`text-[0.625rem] text-foreground-secondary text-center pt-4 opacity-50 ${isDayDropTarget ? "hidden" : ""}`}>Sin citas</p>
                        )}
                        {isDayDropTarget && dayApts.length === 0 && (
                          <div className="border-2 border-dashed border-primary/40 rounded-[8px] p-3 text-center">
                            <p className="text-[0.625rem] text-primary font-medium">Soltar aquí</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Search bar for week view */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2"><Search className="w-4 h-4 text-foreground-secondary" />
                  <input type="text" placeholder="Buscar paciente o cita..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)} className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
                </div>
              </div>
            </div>
          )}
        </CardContent></Card>

        <div className={`${!selectedAppointment ? "hidden lg:block" : ""}`}>
          <AnimatePresence mode="wait">
            {selectedAppointment ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <Card><CardHeader>
                  <div className="flex items-start justify-between"><CardTitle>Detalle de Cita</CardTitle>
                    <button onClick={() => setSelectedAppointment(null)} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-surface-alt transition-colors"><X className="w-4 h-4 text-foreground-secondary" /></button>
                  </div>
                </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Paciente</p><p className="font-semibold text-foreground">{selectedAppointment.patient?.full_name || "-"}</p></div></div>
                      <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Doctor</p><p className="font-semibold text-foreground">{selectedAppointment.doctor?.full_name || "-"}</p></div></div>
                      <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Horario</p><p className="font-semibold text-foreground">{selectedAppointment.start_time?.slice(0, 5)} ({selectedAppointment.duration_minutes} min)</p></div></div>
                      <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><CalendarIcon className="w-5 h-5 text-primary" /></div><div><p className="text-[0.75rem] text-foreground-secondary">Tipo</p><p className="font-semibold text-foreground">{selectedAppointment.type}</p></div></div>
                    </div>
                    <div className="pt-3 border-t border-border"><Badge variant={STATUS_COLORS[selectedAppointment.status]} className="mb-4">{STATUS_LABELS[selectedAppointment.status]}</Badge></div>
                    <div className="space-y-2">
                      <Link to={`/historia-clinica/${selectedAppointment.patient_id}`}><Button variant="primary" className="w-full">Ver Historia Clínica</Button></Link>
                      <Button variant="tertiary" className="w-full" onClick={openEditModal}>Editar Cita</Button>
                      {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                        <Button variant="danger" className="w-full" onClick={() => setShowCancelModal(true)}>Cancelar Cita</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card><CardContent className="p-12 text-center">
                  <CalendarIcon className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                  <p className="text-[0.875rem] text-foreground-secondary">Selecciona una cita para ver los detalles</p>
                </CardContent></Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Appointment Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva Cita" size="md">
        <form onSubmit={handleCreateApt} className="space-y-4">
          <div>
            <label className={labelClass}>Paciente *</label>
            <select className={inputClass} value={aptForm.patient_id} onChange={e => setAptForm({ ...aptForm, patient_id: e.target.value })}>
              <option value="">Seleccionar paciente</option>
              {patients.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Doctor / Especialista</label>
            <select className={inputClass} value={aptForm.doctor_id} onChange={e => setAptForm({ ...aptForm, doctor_id: e.target.value })}>
              <option value="">Yo mismo (por defecto)</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Fecha *</label><input type="date" className={inputClass} value={aptForm.date} onChange={e => setAptForm({ ...aptForm, date: e.target.value })} /></div>
            <div><label className={labelClass}>Hora *</label><input type="time" className={inputClass} value={aptForm.start_time} onChange={e => setAptForm({ ...aptForm, start_time: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Tipo de Cita *</label>
              <select className={inputClass} value={aptForm.type} onChange={e => setAptForm({ ...aptForm, type: e.target.value })}>
                {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className={labelClass}>Duración</label>
              <select className={inputClass} value={aptForm.duration_minutes} onChange={e => setAptForm({ ...aptForm, duration_minutes: e.target.value })}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select></div>
          </div>
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
          <div>
            <label className={labelClass}>Doctor / Especialista</label>
            <select className={inputClass} value={editForm.doctor_id} onChange={e => setEditForm({ ...editForm, doctor_id: e.target.value })}>
              <option value="">Sin cambio</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Fecha</label><input type="date" className={inputClass} value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} /></div>
            <div><label className={labelClass}>Hora</label><input type="time" className={inputClass} value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} /></div>
          </div>
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
          <p className="text-[0.875rem] text-foreground-secondary">¿Cancelar la cita de <strong className="text-foreground">{selectedAppointment?.patient?.full_name}</strong> el {selectedAppointment?.date ? new Date(selectedAppointment.date).toLocaleDateString('es-ES') : ""} a las {selectedAppointment?.start_time?.slice(0, 5)}?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowCancelModal(false)}>No, mantener</Button>
            <Button variant="danger" size="md" onClick={handleCancelApt} disabled={saving}>{saving ? "Cancelando..." : "Sí, cancelar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
