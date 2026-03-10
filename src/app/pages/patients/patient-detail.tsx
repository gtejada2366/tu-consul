import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Modal } from "../../components/ui/modal";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, FileText, Edit, Trash2, AlertCircle
} from "lucide-react";
import { usePatient, usePatientMutations } from "../../hooks/use-patients";
import { usePatientAppointments, useAppointmentMutations } from "../../hooks/use-appointments";
import { useMedicalHistory, useConsultationMutations } from "../../hooks/use-medical-history";
import { useClinicUsers } from "../../hooks/use-clinic";
import { inputClass, labelClass, textareaClass } from "../../components/modals/form-classes";
import { APPOINTMENT_TYPES, DURATION_OPTIONS, BLOOD_TYPES, STATUS_COLORS, STATUS_LABELS } from "../../lib/constants";

export function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patient, loading, refetch: refetchPatient } = usePatient(id);
  const { upcoming: upcomingAppointments, refetch: refetchApts } = usePatientAppointments(id);
  const { consultations, refetch: refetchHistory } = useMedicalHistory(id);
  const { updatePatient, deletePatient } = usePatientMutations();
  const { createAppointment } = useAppointmentMutations();
  const { createConsultation } = useConsultationMutations();
  const { users: clinicUsers } = useClinicUsers();
  const doctors = clinicUsers.filter(u => u.role === "doctor" || u.role === "admin");

  const recentHistory = consultations.filter(c => c.type === "consulta").slice(0, 3);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAptModal, setShowAptModal] = useState(false);
  const [showConModal, setShowConModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", address: "", birthdate: "", blood_type: "", allergies: "" });
  const [aptForm, setAptForm] = useState({ date: new Date().toISOString().split("T")[0], start_time: "09:00", duration_minutes: "30", type: "Consulta General", notes: "", doctor_id: "" });
  const [conForm, setConForm] = useState({ title: "", description: "", blood_pressure: "", temperature: "", weight: "", height: "", diagnosis: "" });

  function openEditModal() {
    if (!patient) return;
    setEditForm({
      full_name: patient.full_name, email: patient.email || "", phone: patient.phone || "",
      address: patient.address || "", birthdate: patient.birthdate || "",
      blood_type: patient.blood_type || "", allergies: patient.allergies.join(", "),
    });
    setShowEditModal(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !editForm.full_name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    const { error } = await updatePatient(id, {
      full_name: editForm.full_name.trim(), email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null, address: editForm.address.trim() || null,
      birthdate: editForm.birthdate || null, blood_type: editForm.blood_type || null,
      allergies: editForm.allergies.trim() ? editForm.allergies.split(",").map(a => a.trim()) : [],
    });
    setSaving(false);
    if (error) { toast.error(error); } else { toast.success("Paciente actualizado"); setShowEditModal(false); refetchPatient(); }
  }

  async function handleDelete() {
    if (!id) return;
    setSaving(true);
    const { error } = await deletePatient(id);
    setSaving(false);
    if (error) { toast.error(error); } else { toast.success("Paciente desactivado"); navigate("/pacientes"); }
  }

  async function handleCreateApt(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    const { error } = await createAppointment({
      patient_id: id, doctor_id: aptForm.doctor_id || undefined, date: aptForm.date, start_time: aptForm.start_time,
      duration_minutes: parseInt(aptForm.duration_minutes), type: aptForm.type,
      notes: aptForm.notes || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); } else { toast.success("Cita agendada"); setShowAptModal(false); refetchApts(); }
  }

  async function handleCreateCon(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !conForm.title.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    const { error } = await createConsultation({
      patient_id: id, type: "consulta", title: conForm.title.trim(),
      description: conForm.description.trim() || undefined,
      blood_pressure: conForm.blood_pressure.trim() || undefined,
      temperature: conForm.temperature.trim() || undefined,
      weight: conForm.weight.trim() || undefined, height: conForm.height.trim() || undefined,
      diagnosis: conForm.diagnosis.trim() || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); } else {
      toast.success("Evolución registrada"); setShowConModal(false);
      setConForm({ title: "", description: "", blood_pressure: "", temperature: "", weight: "", height: "", diagnosis: "" });
      refetchHistory();
    }
  }

  if (loading) return <Loading />;

  if (!patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/pacientes"><Button variant="ghost" size="md"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
        <Card><CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-foreground-secondary mb-4 opacity-50" />
            <h2 className="text-[1.25rem] font-semibold text-foreground mb-2">Paciente no encontrado</h2>
            <p className="text-[0.875rem] text-foreground-secondary">No se encontró un paciente con el ID especificado.</p>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/pacientes"><Button variant="ghost" size="md"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <Card><CardContent className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-semibold text-primary">{patient.full_name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">{patient.full_name}</h1>
                <Badge variant={patient.status === "active" ? "success" : "secondary"}>{patient.status === "active" ? "Activo" : "Inactivo"}</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[0.875rem] text-foreground-secondary"><Mail className="w-4 h-4" /><span>{patient.email || "-"}</span></div>
                <div className="flex items-center gap-2 text-[0.875rem] text-foreground-secondary"><Phone className="w-4 h-4" /><span>{patient.phone || "-"}</span></div>
                <div className="flex items-center gap-2 text-[0.875rem] text-foreground-secondary"><MapPin className="w-4 h-4" /><span>{patient.address || "-"}</span></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="md" onClick={openEditModal}><Edit className="w-4 h-4 mr-2" />Editar</Button>
            <Button variant="danger" size="md" onClick={() => setShowDeleteModal(true)}><Trash2 className="w-4 h-4 mr-2" />Eliminar</Button>
          </div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>Información Médica</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Fecha de Nacimiento</p>
              <p className="text-[0.875rem] text-foreground">{patient.birthdate ? `${new Date(patient.birthdate).toLocaleDateString('es-ES')} (${patient.age} años)` : "-"}</p></div>
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Grupo Sanguíneo</p>
              <p className="text-[0.875rem] text-foreground">{patient.blood_type || "-"}</p></div>
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Alergias</p>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.length > 0 ? patient.allergies.map((a, i) => <Badge key={i} variant="danger">{a}</Badge>) : <span className="text-[0.875rem] text-foreground-secondary">Ninguna</span>}
              </div></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>Estadísticas de Visitas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Total de Visitas</p>
              <p className="text-[1.75rem] font-semibold text-foreground">{patient.total_visits}</p></div>
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Última Visita</p>
              <p className="text-[0.875rem] text-foreground">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : "Sin visitas"}</p></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="primary" className="w-full justify-start" onClick={() => setShowAptModal(true)}><Calendar className="w-4 h-4 mr-2" />Agendar Cita</Button>
            <Link to={`/historia-clinica/${id}`} className="block"><Button variant="tertiary" className="w-full justify-start"><FileText className="w-4 h-4 mr-2" />Ver Historia Clínica</Button></Link>
            <Button variant="tertiary" className="w-full justify-start" onClick={() => setShowConModal(true)}><Clock className="w-4 h-4 mr-2" />Registrar Evolución</Button>
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle>Próximas Citas</CardTitle></CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-[10px] border border-border hover:bg-surface-alt transition-colors duration-150">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center"><Calendar className="w-6 h-6 text-primary" /></div>
                    <div>
                      <p className="font-semibold text-foreground text-[0.875rem]">{apt.type}</p>
                      <p className="text-[0.75rem] text-foreground-secondary">{new Date(apt.date).toLocaleDateString('es-ES')} • {apt.start_time?.slice(0, 5)}</p>
                    </div>
                  </div>
                  <Badge variant={STATUS_COLORS[apt.status] || "default"}>{STATUS_LABELS[apt.status] || apt.status}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-[0.875rem] text-foreground-secondary text-center py-8">No hay citas programadas</p>}
        </CardContent>
      </Card>

      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historia Clínica</CardTitle>
          <Link to={`/historia-clinica/${id}`}><Button variant="ghost" size="sm">Ver completa</Button></Link>
        </div>
      </CardHeader>
        <CardContent>
          {recentHistory.length > 0 ? (
            <div className="space-y-4">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 rounded-[10px] border border-border">
                  <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="font-semibold text-foreground text-[0.875rem]">{entry.title}</p><p className="text-[0.75rem] text-foreground-secondary">{new Date(entry.date).toLocaleDateString('es-ES')}</p></div>
                      <Badge variant="default">Completada</Badge>
                    </div>
                    <p className="text-[0.875rem] text-foreground-secondary">{entry.diagnosis || entry.description || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-[0.875rem] text-foreground-secondary text-center py-8">No hay registros en la historia clínica</p>}
        </CardContent>
      </Card>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Paciente" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div><label className={labelClass}>Nombre Completo *</label><input type="text" className={inputClass} value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div><label className={labelClass}>Teléfono</label><input type="tel" className={inputClass} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>Dirección</label><input type="text" className={inputClass} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" className={inputClass} value={editForm.birthdate} onChange={e => setEditForm({ ...editForm, birthdate: e.target.value })} /></div>
            <div><label className={labelClass}>Grupo Sanguíneo</label>
              <select className={inputClass} value={editForm.blood_type} onChange={e => setEditForm({ ...editForm, blood_type: e.target.value })}>
                <option value="">Seleccionar</option>{BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
          <div><label className={labelClass}>Alergias (separadas por coma)</label><input type="text" className={inputClass} value={editForm.allergies} onChange={e => setEditForm({ ...editForm, allergies: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowEditModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar Cambios"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmar Eliminación" size="sm">
        <div className="space-y-4">
          <p className="text-[0.875rem] text-foreground-secondary">¿Desactivar a <strong className="text-foreground">{patient.full_name}</strong>? No se eliminará permanentemente.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" size="md" onClick={handleDelete} disabled={saving}>{saving ? "Desactivando..." : "Desactivar"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAptModal} onClose={() => setShowAptModal(false)} title="Agendar Cita" size="md">
        <form onSubmit={handleCreateApt} className="space-y-4">
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
            <Button variant="tertiary" size="md" onClick={() => setShowAptModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Agendando..." : "Agendar Cita"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showConModal} onClose={() => setShowConModal(false)} title="Registrar Evolución" size="lg">
        <form onSubmit={handleCreateCon} className="space-y-4">
          <div><label className={labelClass}>Título *</label><input type="text" className={inputClass} placeholder="Ej: Consulta de control" value={conForm.title} onChange={e => setConForm({ ...conForm, title: e.target.value })} /></div>
          <div><label className={labelClass}>Descripción</label><textarea className={textareaClass} placeholder="Descripción..." value={conForm.description} onChange={e => setConForm({ ...conForm, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={labelClass}>Presión</label><input type="text" className={inputClass} placeholder="120/80" value={conForm.blood_pressure} onChange={e => setConForm({ ...conForm, blood_pressure: e.target.value })} /></div>
            <div><label className={labelClass}>Temp.</label><input type="text" className={inputClass} placeholder="36.5°C" value={conForm.temperature} onChange={e => setConForm({ ...conForm, temperature: e.target.value })} /></div>
            <div><label className={labelClass}>Peso</label><input type="text" className={inputClass} placeholder="70kg" value={conForm.weight} onChange={e => setConForm({ ...conForm, weight: e.target.value })} /></div>
            <div><label className={labelClass}>Altura</label><input type="text" className={inputClass} placeholder="170cm" value={conForm.height} onChange={e => setConForm({ ...conForm, height: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>Diagnóstico</label><textarea className={textareaClass} placeholder="Diagnóstico..." value={conForm.diagnosis} onChange={e => setConForm({ ...conForm, diagnosis: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowConModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
