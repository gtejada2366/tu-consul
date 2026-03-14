import { useParams, Link, useNavigate } from "react-router";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { EmptyState } from "../../components/ui/empty-state";
import {
  ArrowLeft, Calendar, Clock, User, ChevronLeft, ChevronRight,
  Stethoscope, Users as UsersIcon, Search, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDoctorAppointments, useDoctorWeekAppointments } from "../../hooks/use-doctors";
import { useClinicUsers, useClinicSchedules } from "../../hooks/use-clinic";
import {
  APPOINTMENT_TYPES, STATUS_COLORS, STATUS_LABELS,
  generateTimeSlots, getTypeColor, toLocalDateStr, to12h
} from "../../lib/constants";
import type { AppointmentWithRelations, User as UserType } from "../../lib/types";

function formatDate(date: Date): string { return toLocalDateStr(date); }
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

const WEEK_DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useClinicUsers();
  const { schedules } = useClinicSchedules();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [agendaSearch, setAgendaSearch] = useState("");

  const weekRange = getWeekRange(currentDate);
  const { appointments, loading: aptsLoading, refetch } = useDoctorAppointments(id, formatDate(currentDate));
  const { appointments: weekAppointments, loading: weekLoading, refetch: refetchWeek } = useDoctorWeekAppointments(id, formatDate(weekRange.start), formatDate(weekRange.end));

  const doctor: UserType | undefined = users.find(u => u.id === id);

  // Dynamic time slots from clinic schedule
  const dayOfWeek = currentDate.getDay();
  const dbDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const todaySchedule = schedules.find(s => s.day_of_week === dbDayOfWeek && s.is_active);
  const timeSlots = generateTimeSlots(todaySchedule?.start_time?.slice(0, 5), todaySchedule?.end_time?.slice(0, 5));

  // Week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekRange.start);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Stats for this doctor
  const todayStr = formatDate(new Date());
  const todayCount = weekAppointments.filter(a => a.date === todayStr).length;
  const weekCount = weekAppointments.length;
  const completedCount = weekAppointments.filter(a => a.status === "completed").length;
  const pendingCount = weekAppointments.filter(a => a.status === "pending" || a.status === "confirmed").length;

  function goToDay(offset: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === "week" ? offset * 7 : offset));
    setCurrentDate(d);
    setSelectedAppointment(null);
  }
  function goToToday() { setCurrentDate(new Date()); setSelectedAppointment(null); }

  if (usersLoading) return <Loading />;

  if (!doctor) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/doctores")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Volver
        </Button>
        <EmptyState
          icon={Stethoscope}
          title="Doctor no encontrado"
          description="El doctor que buscas no existe o fue eliminado"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/doctores")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground truncate">
            Dr. {doctor.full_name}
          </h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-0.5">
            {doctor.specialty || "General"} {!doctor.is_active && <Badge variant="default" className="ml-2">Inactivo</Badge>}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-[1.5rem] font-semibold text-foreground">{todayCount}</p>
            <p className="text-[0.6875rem] text-foreground-secondary">Citas hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-[1.5rem] font-semibold text-foreground">{weekCount}</p>
            <p className="text-[0.6875rem] text-foreground-secondary">Esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Stethoscope className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-[1.5rem] font-semibold text-foreground">{completedCount}</p>
            <p className="text-[0.6875rem] text-foreground-secondary">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UsersIcon className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-[1.5rem] font-semibold text-foreground">{pendingCount}</p>
            <p className="text-[0.6875rem] text-foreground-secondary">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation bar */}
      <Card><CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => goToDay(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="flex items-center gap-2 h-10 px-2">
              <Calendar className="w-4 h-4 text-foreground-secondary flex-shrink-0 hidden sm:block" />
              <span className="font-semibold text-foreground text-[0.8125rem] sm:text-[0.875rem] leading-none">
                {view === "week"
                  ? `${weekRange.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${weekRange.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : formatDisplayDate(currentDate)}
              </span>
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

      {/* Type legend */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        {APPOINTMENT_TYPES.map(t => {
          const tc = getTypeColor(t);
          return (
            <div key={t} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${tc.dot} flex-shrink-0`} />
              <span className="text-[0.6875rem] text-foreground-secondary">{t}</span>
            </div>
          );
        })}
      </div>

      {/* Agenda grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardContent className="p-0">
          {(view === "day" ? aptsLoading : weekLoading) ? <Loading /> : view === "day" ? (
            /* ===== DAY VIEW ===== */
            <div className="overflow-y-auto max-h-[600px]">
              <div className="relative">
                <div className="sticky top-0 bg-surface z-10 border-b border-border p-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-foreground-secondary" />
                    <input type="text" placeholder="Buscar paciente..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)}
                      className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
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
                    return (
                      <div key={time} className="flex border-b border-border last:border-0">
                        <div className="w-16 py-3 text-[0.75rem] text-foreground-secondary font-medium">{to12h(time)}</div>
                        <div className="flex-1 py-2">
                          {slotApts.map((apt) => {
                            const tc = getTypeColor(apt.type);
                            return (
                              <div key={apt.id} onClick={() => setSelectedAppointment(apt)}
                                className={`mb-2 p-3 rounded-[10px] border-l-4 cursor-pointer transition-all duration-150 ${tc.bg} ${tc.border} hover:shadow-sm`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground text-[0.875rem] truncate">{apt.patient?.full_name || "-"}</p>
                                    <p className="text-[0.75rem] text-foreground-secondary mt-0.5">{apt.type} • {apt.duration_minutes} min</p>
                                  </div>
                                  <Badge variant={STATUS_COLORS[apt.status]}>{STATUS_LABELS[apt.status]}</Badge>
                                </div>
                              </div>
                            );
                          })}
                          {slotApts.length === 0 && <div className="h-12 rounded-[8px]"></div>}
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
              <div className="min-w-[780px]">
                {/* Search */}
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-foreground-secondary" />
                    <input type="text" placeholder="Buscar paciente..." value={agendaSearch} onChange={e => setAgendaSearch(e.target.value)}
                      className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
                  </div>
                </div>
                {/* Header: empty cell + 7 day columns */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-surface z-10">
                  <div className="border-r border-border" />
                  {weekDays.map((d, i) => {
                    const isToday = formatDate(d) === formatDate(new Date());
                    const isSelected = formatDate(d) === formatDate(currentDate);
                    return (
                      <button key={i} onClick={() => { setCurrentDate(new Date(d)); setView("day"); }}
                        className={`py-3 text-center border-r border-border last:border-r-0 transition-colors hover:bg-surface-alt
                          ${isToday ? "bg-primary/5" : ""} ${isSelected ? "bg-primary/10" : ""}`}>
                        <p className="text-[0.6875rem] font-medium text-foreground-secondary">{WEEK_DAY_NAMES[i]}</p>
                        <p className={`text-[1rem] font-semibold mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
                      </button>
                    );
                  })}
                </div>
                {/* Time grid: hour rows × day columns */}
                <div className="overflow-y-auto max-h-[500px]">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-0">
                      {/* Hour label */}
                      <div className="border-r border-border py-2 px-1 text-[0.6875rem] text-foreground-secondary font-medium text-right pr-2">
                        {to12h(time)}
                      </div>
                      {/* Day cells for this time slot */}
                      {weekDays.map((d, i) => {
                        const dateStr = formatDate(d);
                        const isToday = dateStr === formatDate(new Date());
                        const slotApts = weekAppointments.filter(a => {
                          if (a.date !== dateStr || a.start_time?.slice(0, 5) !== time) return false;
                          if (!agendaSearch.trim()) return true;
                          const q = agendaSearch.toLowerCase();
                          return (a.patient?.full_name || "").toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
                        });
                        return (
                          <div key={i} className={`border-r border-border last:border-r-0 p-0.5 min-h-[48px] ${isToday ? "bg-primary/5" : ""}`}>
                            {slotApts.map(apt => {
                              const tc = getTypeColor(apt.type);
                              return (
                                <div key={apt.id} onClick={() => setSelectedAppointment(apt)}
                                  className={`p-1.5 rounded-[6px] border-l-3 cursor-pointer text-left ${tc.bg} ${tc.border} hover:shadow-sm mb-0.5`}>
                                  <p className="text-[0.625rem] font-semibold text-foreground truncate">{apt.patient?.full_name || "-"}</p>
                                  <p className="text-[0.5625rem] text-foreground-secondary truncate">{apt.type}</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent></Card>

        {/* Detail sidebar */}
        <div className={`${!selectedAppointment ? "hidden lg:block" : ""}`}>
          <AnimatePresence mode="wait">
            {selectedAppointment ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <Card><CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>Detalle de Cita</CardTitle>
                    <button onClick={() => setSelectedAppointment(null)} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-surface-alt transition-colors">
                      <span className="text-foreground-secondary text-lg">&times;</span>
                    </button>
                  </div>
                </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div>
                        <div><p className="text-[0.75rem] text-foreground-secondary">Paciente</p><p className="font-semibold text-foreground">{selectedAppointment.patient?.full_name || "-"}</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-primary" /></div>
                        <div><p className="text-[0.75rem] text-foreground-secondary">Horario</p><p className="font-semibold text-foreground">{to12h(selectedAppointment.start_time)} ({selectedAppointment.duration_minutes} min)</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-primary" /></div>
                        <div><p className="text-[0.75rem] text-foreground-secondary">Tipo</p><p className="font-semibold text-foreground">{selectedAppointment.type}</p></div>
                      </div>
                      {selectedAppointment.notes && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
                          <div><p className="text-[0.75rem] text-foreground-secondary">Notas</p><p className="text-[0.875rem] text-foreground">{selectedAppointment.notes}</p></div>
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-border">
                      <Badge variant={STATUS_COLORS[selectedAppointment.status]} className="mb-4">{STATUS_LABELS[selectedAppointment.status]}</Badge>
                    </div>
                    <div className="space-y-2">
                      <Link to={`/historia-clinica/${selectedAppointment.patient_id}`}>
                        <Button variant="primary" className="w-full">Ver Historia Clínica</Button>
                      </Link>
                      <Link to={`/agenda?date=${selectedAppointment.date}`}>
                        <Button variant="tertiary" className="w-full">Ver en Agenda General</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card><div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                  <p className="text-[0.875rem] text-foreground-secondary">Selecciona una cita para ver los detalles</p>
                </div></Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
