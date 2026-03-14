import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Modal } from "../../components/ui/modal";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Trash2, AlertCircle,
  Plus, User, Heart, Stethoscope, Shield, Tag, X
} from "lucide-react";
import { usePatient, usePatientMutations } from "../../hooks/use-patients";
import { usePatientAppointments, useAppointmentMutations } from "../../hooks/use-appointments";
import { useMedicalHistory, useConsultationMutations } from "../../hooks/use-medical-history";
import { useClinicUsers } from "../../hooks/use-clinic";
import { inputClass, labelClass, textareaClass } from "../../components/modals/form-classes";
import { SearchableSelect } from "../../components/ui/searchable-select";
import { APPOINTMENT_TYPES, DURATION_OPTIONS, INTEREST_TAGS, getTagColor, STATUS_COLORS, STATUS_LABELS, toLocalDateStr, to12h } from "../../lib/constants";

// Tab components
import { PersonalDataTab } from "./tabs/personal-data-tab";
import { ContactTab } from "./tabs/contact-tab";
import { MedicalTab } from "./tabs/medical-tab";
import { DentalTab } from "./tabs/dental-tab";
import { InsuranceTab } from "./tabs/insurance-tab";

const TABS = [
  { id: "personal", label: "Datos Personales", icon: User },
  { id: "contact", label: "Contacto", icon: Phone },
  { id: "medical", label: "Antecedentes Médicos", icon: Heart },
  { id: "dental", label: "Antecedentes Odontológicos", icon: Stethoscope },
  { id: "insurance", label: "Seguro", icon: Shield },
  { id: "appointments", label: "Citas", icon: Calendar },
  { id: "history", label: "Historia Clínica", icon: FileText },
  { id: "interests", label: "Intereses", icon: Tag },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
  const recentHistory = consultations.filter(c => c.type === "consulta").slice(0, 5);

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAptModal, setShowAptModal] = useState(false);
  const [showConModal, setShowConModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aptForm, setAptForm] = useState({ date: toLocalDateStr(new Date()), start_time: "09:00", duration_minutes: "30", type: "Consulta General", status: "pending", notes: "", doctor_id: "" });
  const [conForm, setConForm] = useState({ title: "", description: "", blood_pressure: "", temperature: "", weight: "", height: "", diagnosis: "" });

  async function handleSavePatient(updates: Record<string, unknown>) {
    if (!id) return { error: "No hay ID de paciente" };
    return updatePatient(id, updates);
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
      duration_minutes: parseInt(aptForm.duration_minutes), type: aptForm.type, status: aptForm.status,
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

  async function handleToggleTag(tag: string) {
    if (!id || !patient) return;
    const currentTags = patient.interest_tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setSaving(true);
    const { error } = await updatePatient(id, { interest_tags: newTags });
    setSaving(false);
    if (error) { toast.error(error); } else {
      toast.success(currentTags.includes(tag) ? "Tag removido" : "Tag agregado");
      refetchPatient();
    }
  }

  if (loading) return <Loading />;

  if (!patient) {
    return (
      <div className="space-y-6">
        <Link to="/pacientes"><Button variant="ghost" size="md"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        <Card>
          <div className="flex flex-col items-center justify-center p-6 py-12 text-center">
            <AlertCircle className="w-12 h-12 text-foreground-secondary mb-4 opacity-50" />
            <h2 className="text-[1.25rem] font-semibold text-foreground mb-2">Paciente no encontrado</h2>
            <p className="text-[0.875rem] text-foreground-secondary">No se encontró un paciente con el ID especificado.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/pacientes"><Button variant="ghost" size="md"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>

      {/* Patient header card */}
      <Card>
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-primary">{patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-[1.25rem] md:text-[1.5rem] font-semibold text-foreground">{patient.full_name}</h1>
                  <Badge variant={patient.status === "active" ? "success" : "default"}>{patient.status === "active" ? "Activo" : "Inactivo"}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-foreground-secondary">
                  {patient.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{patient.email}</span>}
                  {patient.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{patient.phone}</span>}
                  {patient.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{patient.address}</span>}
                  {patient.age != null && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{patient.age} años</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => setShowAptModal(true)}><Plus className="w-4 h-4 mr-1" />Cita</Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab navigation */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-[12px] p-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-[0.8125rem] font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface-alt"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <Card>
        <CardContent className="p-5 md:p-6">
          {activeTab === "personal" && (
            <PersonalDataTab patient={patient} onSave={handleSavePatient} onRefetch={refetchPatient} />
          )}
          {activeTab === "contact" && (
            <ContactTab patient={patient} onSave={handleSavePatient} onRefetch={refetchPatient} />
          )}
          {activeTab === "medical" && (
            <MedicalTab patient={patient} onSave={handleSavePatient} onRefetch={refetchPatient} />
          )}
          {activeTab === "dental" && (
            <DentalTab patient={patient} onSave={handleSavePatient} onRefetch={refetchPatient} />
          )}
          {activeTab === "insurance" && (
            <InsuranceTab patient={patient} onSave={handleSavePatient} onRefetch={refetchPatient} />
          )}

          {/* Appointments tab */}
          {activeTab === "appointments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Próximas Citas</h3>
                <Button variant="primary" size="sm" onClick={() => setShowAptModal(true)}><Plus className="w-4 h-4 mr-1" />Agendar</Button>
              </div>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 rounded-[10px] border border-border hover:bg-surface-alt transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
                        <div>
                          <p className="font-semibold text-foreground text-[0.875rem]">{apt.type}</p>
                          <p className="text-[0.75rem] text-foreground-secondary">{apt.date.split("-").reverse().join("/")} • {to12h(apt.start_time)}</p>
                        </div>
                      </div>
                      <Badge variant={STATUS_COLORS[apt.status] || "default"}>{STATUS_LABELS[apt.status] || apt.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[0.875rem] text-foreground-secondary text-center py-8">No hay citas programadas</p>}
            </div>
          )}

          {/* Clinical History tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Historia Clínica</h3>
                <div className="flex items-center gap-2">
                  <Button variant="tertiary" size="sm" onClick={() => setShowConModal(true)}><Plus className="w-4 h-4 mr-1" />Evolución</Button>
                  <Link to={`/historia-clinica/${id}`}><Button variant="ghost" size="sm">Ver completa</Button></Link>
                </div>
              </div>
              {recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {recentHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-4 p-4 rounded-[10px] border border-border">
                      <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div><p className="font-semibold text-foreground text-[0.875rem]">{entry.title}</p><p className="text-[0.75rem] text-foreground-secondary">{entry.date.split("-").reverse().join("/")}</p></div>
                          <Badge variant="default">Completada</Badge>
                        </div>
                        <p className="text-[0.8125rem] text-foreground-secondary">{entry.diagnosis || entry.description || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[0.875rem] text-foreground-secondary text-center py-8">No hay registros en la historia clínica</p>}
            </div>
          )}

          {/* Interests / Marketing Tags tab */}
          {activeTab === "interests" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Intereses y Segmentación</h3>
                <p className="text-[0.8125rem] text-foreground-secondary">Tags para campañas de marketing. Selecciona los intereses del paciente para segmentar tu público.</p>
              </div>

              {/* Current tags */}
              {(patient.interest_tags ?? []).length > 0 && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Tags actuales</p>
                  <div className="flex flex-wrap gap-2">
                    {(patient.interest_tags ?? []).map(tag => {
                      const color = getTagColor(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleToggleTag(tag)}
                          disabled={saving}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.8125rem] font-medium border transition-all hover:opacity-80 ${color.bg} ${color.text} ${color.border}`}
                        >
                          {tag}
                          <X className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All available tags */}
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Agregar tags</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TAGS.filter(tag => !(patient.interest_tags ?? []).includes(tag)).map(tag => {
                    const color = getTagColor(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        disabled={saving}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.8125rem] font-medium border transition-all hover:shadow-sm opacity-60 hover:opacity-100 ${color.bg} ${color.text} ${color.border}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmar Eliminación" size="sm">
        <div className="space-y-4">
          <p className="text-[0.875rem] text-foreground-secondary">¿Desactivar a <strong className="text-foreground">{patient.full_name}</strong>? No se eliminará permanentemente.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" size="md" onClick={handleDelete} disabled={saving}>{saving ? "Desactivando..." : "Desactivar"}</Button>
          </div>
        </div>
      </Modal>

      {/* Appointment Modal */}
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
          <div><label className={labelClass}>Notas</label><textarea className={textareaClass} placeholder="Notas..." value={aptForm.notes} onChange={e => setAptForm({ ...aptForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowAptModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Agendando..." : "Agendar Cita"}</Button>
          </div>
        </form>
      </Modal>

      {/* Consultation Modal */}
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
