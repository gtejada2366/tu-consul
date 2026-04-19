import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Modal } from "../../components/ui/modal";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Trash2, AlertCircle,
  Plus, User, Heart, Stethoscope, Shield, Tag, X, MessageCircle, CreditCard,
  Check, DollarSign, ClipboardList, ChevronDown, ChevronUp, Banknote, Mic
} from "lucide-react";
import { VoiceDictationModal, type ParsedDictation } from "../../components/voice-dictation-modal";
import { usePatient, usePatientMutations } from "../../hooks/use-patients";
import { usePatientAppointments, useAppointmentMutations } from "../../hooks/use-appointments";
import { useMedicalHistory, useConsultationMutations } from "../../hooks/use-medical-history";
import { useClinicUsers, useClinicServices } from "../../hooks/use-clinic";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/auth-context";
import type { PotentialTreatment, TreatmentPayment } from "../../lib/types";
import { inputClass, labelClass, textareaClass } from "../../components/modals/form-classes";
import { SearchableSelect } from "../../components/ui/searchable-select";
import { APPOINTMENT_TYPES, DURATION_OPTIONS, INTEREST_TAGS, getTagColor, STATUS_COLORS, STATUS_LABELS, toLocalDateStr, to12h, generateTimeSlots } from "../../lib/constants";

// Tab components
import { PersonalDataTab } from "./tabs/personal-data-tab";
import { ContactTab } from "./tabs/contact-tab";
import { MedicalTab } from "./tabs/medical-tab";
import { DentalTab } from "./tabs/dental-tab";
import { InsuranceTab } from "./tabs/insurance-tab";
import { OdontogramTab } from "./tabs/odontogram-tab";

const TABS = [
  { id: "personal", label: "Datos Personales", icon: User },
  { id: "contact", label: "Contacto", icon: Phone },
  { id: "medical", label: "Antecedentes Médicos", icon: Heart },
  { id: "dental", label: "Antecedentes Odontológicos", icon: Stethoscope },
  { id: "odontogram", label: "Odontograma", icon: ClipboardList },
  { id: "insurance", label: "Seguro", icon: Shield },
  { id: "appointments", label: "Citas", icon: Calendar },
  { id: "history", label: "Historia Clínica", icon: FileText },
  { id: "interests", label: "Intereses Marketing", icon: Tag },
  { id: "potential", label: "Facturación Potencial", icon: CreditCard },
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
  const { services: clinicServices } = useClinicServices();
  const { clinic } = useAuth();
  const activeServices = clinicServices.filter(s => s.is_active);
  const doctors = clinicUsers.filter(u => u.role === "doctor" || u.role === "admin");
  const recentHistory = consultations.filter(c => c.type === "consulta").slice(0, 5);

  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAptModal, setShowAptModal] = useState(false);
  const [showConModal, setShowConModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceExtras, setVoiceExtras] = useState<{ prescripciones?: ParsedDictation["prescripciones"]; proxima_cita?: ParsedDictation["proxima_cita"] } | null>(null);
  const [saving, setSaving] = useState(false);

  // Potential billing state
  const [potentialTreatments, setPotentialTreatments] = useState<PotentialTreatment[]>([]);
  const [performedServices, setPerformedServices] = useState<{ id: string; service_name: string; price: number; quantity: number; date: string; created_at: string }[]>([]);
  const [potentialLoading, setPotentialLoading] = useState(false);
  const [showAddPotentialModal, setShowAddPotentialModal] = useState(false);
  const [deletingTreatmentId, setDeletingTreatmentId] = useState<string | null>(null);
  const [potentialForm, setPotentialForm] = useState({ service: "", estimated_amount: "", quantity: "1", notes: "" });

  // Payment tracking state
  const [treatmentPayments, setTreatmentPayments] = useState<Record<string, TreatmentPayment[]>>({});
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null); // treatment id
  const [paymentForm, setPaymentForm] = useState({ amount: "", payment_method: "cash", notes: "" });
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);

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
    const bp = conForm.blood_pressure.trim();
    if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) {
      toast.error("Presión arterial debe tener formato NN/NN (ej: 120/80)"); return;
    }
    const temp = conForm.temperature.trim().replace("°C", "").replace("°c", "").trim();
    if (temp && (isNaN(Number(temp)) || Number(temp) < 30 || Number(temp) > 45)) {
      toast.error("Temperatura debe ser un número entre 30 y 45 °C"); return;
    }
    const w = conForm.weight.trim().replace("kg", "").replace("Kg", "").trim();
    if (w && (isNaN(Number(w)) || Number(w) <= 0 || Number(w) > 500)) {
      toast.error("Peso debe ser un número válido en kg (1-500)"); return;
    }
    const h = conForm.height.trim().replace("cm", "").trim();
    if (h && (isNaN(Number(h)) || Number(h) <= 0 || Number(h) > 300)) {
      toast.error("Altura debe ser un número válido en cm (1-300)"); return;
    }
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

  function handleVoiceApply(parsed: ParsedDictation) {
    const descriptionParts: string[] = [];
    if (parsed.motivo_consulta) descriptionParts.push(`Motivo: ${parsed.motivo_consulta}`);
    if (parsed.tratamiento_realizado) descriptionParts.push(`Tratamiento: ${parsed.tratamiento_realizado}`);
    if (parsed.observaciones) descriptionParts.push(`Observaciones: ${parsed.observaciones}`);

    setConForm(prev => ({
      ...prev,
      title: parsed.motivo_consulta || prev.title || "Consulta",
      description: descriptionParts.join("\n") || prev.description,
      diagnosis: parsed.diagnostico || prev.diagnosis,
    }));

    const extras = {
      prescripciones: parsed.prescripciones?.length ? parsed.prescripciones : undefined,
      proxima_cita: parsed.proxima_cita || undefined,
    };
    if (extras.prescripciones || extras.proxima_cita) {
      setVoiceExtras(extras);
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

  // Fetch potential treatments + performed services + payments
  async function fetchPotentialTreatments() {
    if (!id || !clinic) return;
    setPotentialLoading(true);
    const [treatmentsRes, servicesRes, paymentsRes] = await Promise.all([
      supabase
        .from("potential_treatments")
        .select("*")
        .eq("patient_id", id)
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointment_services")
        .select("id, service_name, price, quantity, created_at, appointment_id, appointments!inner(date, patient_id)")
        .eq("clinic_id", clinic.id)
        .eq("appointments.patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("treatment_payments")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false }),
    ]);
    if (!mountedRef.current) return;
    if (treatmentsRes.data) setPotentialTreatments(treatmentsRes.data as unknown as PotentialTreatment[]);
    if (servicesRes.data) {
      setPerformedServices(
        (servicesRes.data as unknown as { id: string; service_name: string; price: number; quantity: number; created_at: string; appointments: { date: string } }[])
          .map(s => ({ id: s.id, service_name: s.service_name, price: s.price, quantity: s.quantity, date: s.appointments.date, created_at: s.created_at }))
      );
    }
    // Group payments by treatment_id
    if (paymentsRes.data) {
      const grouped: Record<string, TreatmentPayment[]> = {};
      for (const p of paymentsRes.data as unknown as TreatmentPayment[]) {
        if (!grouped[p.treatment_id]) grouped[p.treatment_id] = [];
        grouped[p.treatment_id].push(p);
      }
      setTreatmentPayments(grouped);
    }
    setPotentialLoading(false);
  }

  // Load potential treatments when tab is selected
  function handleTabChange(tabId: TabId) {
    setActiveTab(tabId);
    if (tabId === "potential") fetchPotentialTreatments();
  }

  async function handleAddPotential(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !clinic || !potentialForm.service.trim()) {
      toast.error("Selecciona un servicio"); return;
    }
    const estAmount = parseFloat(potentialForm.estimated_amount);
    if (potentialForm.estimated_amount && (isNaN(estAmount) || estAmount < 0)) {
      toast.error("El monto estimado debe ser un número válido"); return;
    }
    const qty = parseInt(potentialForm.quantity) || 1;
    if (qty < 1) { toast.error("La cantidad debe ser al menos 1"); return; }
    setSaving(true);
    const { error } = await supabase.from("potential_treatments").insert({
      clinic_id: clinic.id,
      patient_id: id,
      service: potentialForm.service.trim(),
      estimated_amount: estAmount > 0 ? estAmount : 0,
      quantity: qty,
      notes: potentialForm.notes.trim() || null,
      status: "pending",
    } as Record<string, unknown>);
    setSaving(false);
    if (error) toast.error("Error al agregar el servicio");
    else {
      toast.success("Servicio agregado");
      setShowAddPotentialModal(false);
      setPotentialForm({ service: "", estimated_amount: "", quantity: "1", notes: "" });
      fetchPotentialTreatments();

      // Auto-add service as interest tag
      const serviceName = potentialForm.service.trim();
      const currentTags = patient?.interest_tags ?? [];
      if (serviceName && !currentTags.includes(serviceName)) {
        await updatePatient(id, { interest_tags: [...currentTags, serviceName] });
        refetchPatient();
      }
    }
  }

  async function togglePotentialStatus(treatment: PotentialTreatment) {
    if (!clinic) return;
    const newStatus = treatment.status === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("potential_treatments")
      .update({ status: newStatus, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", treatment.id)
      .eq("clinic_id", clinic.id);
    if (error) toast.error("Error al actualizar el estado del servicio");
    else {
      toast.success(newStatus === "completed" ? "Marcado como realizado" : "Marcado como pendiente");
      fetchPotentialTreatments();
    }
  }

  async function deletePotentialTreatment(treatmentId: string) {
    if (!clinic) return;
    const { error } = await supabase
      .from("potential_treatments")
      .delete()
      .eq("id", treatmentId)
      .eq("clinic_id", clinic.id);
    if (error) toast.error("Error al eliminar el servicio");
    else { toast.success("Servicio eliminado"); fetchPotentialTreatments(); }
  }

  // Payment functions
  function getTreatmentPaid(treatmentId: string): number {
    return (treatmentPayments[treatmentId] || []).reduce((sum, p) => sum + Number(p.amount), 0);
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!clinic || !showPaymentModal) return;
    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) { toast.error("Ingresa un monto válido"); return; }

    // Check it doesn't exceed remaining
    const treatment = potentialTreatments.find(t => t.id === showPaymentModal);
    if (treatment) {
      const total = Number(treatment.estimated_amount) * (treatment.quantity || 1);
      const paid = getTreatmentPaid(treatment.id);
      if (amount > total - paid) {
        toast.error(`El monto excede el saldo pendiente (S/${(total - paid).toFixed(2)})`);
        return;
      }
    }

    setSaving(true);
    const { error } = await supabase.from("treatment_payments").insert({
      clinic_id: clinic.id,
      treatment_id: showPaymentModal,
      amount,
      payment_method: paymentForm.payment_method,
      notes: paymentForm.notes.trim() || null,
    } as Record<string, unknown>);
    setSaving(false);
    if (error) toast.error("Error al registrar el cobro");
    else {
      toast.success("Cobro registrado");
      setShowPaymentModal(null);
      setPaymentForm({ amount: "", payment_method: "cash", notes: "" });
      fetchPotentialTreatments();
    }
  }

  async function deletePayment(paymentId: string) {
    if (!clinic) return;
    const { error } = await supabase
      .from("treatment_payments")
      .delete()
      .eq("id", paymentId)
      .eq("clinic_id", clinic.id);
    if (error) toast.error("Error al eliminar el cobro");
    else { toast.success("Cobro eliminado"); fetchPotentialTreatments(); }
  }

  const PAYMENT_METHODS = [
    { value: "cash", label: "Efectivo" },
    { value: "card", label: "Tarjeta" },
    { value: "transfer", label: "Transferencia" },
    { value: "yape", label: "Yape" },
    { value: "plin", label: "Plin" },
  ];

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
              {(patient.phone || patient.phone_mobile) && (
                <Button variant="tertiary" size="sm" onClick={() => {
                  const phone = (patient.phone_mobile || patient.phone || "").replace(/[^0-9+]/g, "");
                  const num = phone.startsWith("+") ? phone.slice(1) : phone;
                  const name = patient.full_name.split(" ")[0];
                  window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hola ${name}, te escribimos de la clínica.`)}`, "_blank");
                }}><MessageCircle className="w-4 h-4 mr-1" />WhatsApp</Button>
              )}
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
              onClick={() => handleTabChange(tab.id)}
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
          {activeTab === "odontogram" && patient && (
            <OdontogramTab patient={patient} />
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
          {/* Potential Billing tab */}
          {activeTab === "potential" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Facturación Potencial</h3>
                  <p className="text-[0.75rem] text-foreground-secondary mt-0.5">Servicios pendientes y realizados para este paciente</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => {
                  setPotentialForm({ service: "", estimated_amount: "", quantity: "1", notes: "" });
                  setShowAddPotentialModal(true);
                }}><Plus className="w-4 h-4 mr-1" />Agregar</Button>
              </div>

              {potentialLoading ? <Loading /> : (
                <>
                  {/* Potential treatments checklist */}
                  {potentialTreatments.length === 0 && performedServices.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                      <p className="text-[0.875rem] text-foreground-secondary mb-1">No hay servicios registrados</p>
                      <p className="text-[0.75rem] text-foreground-secondary">Agrega servicios que el paciente necesita o se ha realizado</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-warning/5 border border-warning/20 rounded-[10px] text-center">
                          <p className="text-[1.25rem] font-bold text-warning">{potentialTreatments.filter(t => t.status === "pending").length}</p>
                          <p className="text-[0.6875rem] text-foreground-secondary">Pendientes</p>
                        </div>
                        <div className="p-3 bg-success/5 border border-success/20 rounded-[10px] text-center">
                          <p className="text-[1.25rem] font-bold text-success">{potentialTreatments.filter(t => t.status === "completed").length}</p>
                          <p className="text-[0.6875rem] text-foreground-secondary">Completados</p>
                        </div>
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-[10px] text-center">
                          <p className="text-[1.25rem] font-bold text-primary">{performedServices.length}</p>
                          <p className="text-[0.6875rem] text-foreground-secondary">Facturados</p>
                        </div>
                        <div className="p-3 bg-success/5 border border-success/20 rounded-[10px] text-center">
                          <p className="text-[1.25rem] font-bold text-success">
                            {potentialTreatments.filter(t => {
                              const total = Number(t.estimated_amount) * (t.quantity || 1);
                              return total > 0 && getTreatmentPaid(t.id) >= total - 0.01;
                            }).length}
                          </p>
                          <p className="text-[0.6875rem] text-foreground-secondary">Pagados</p>
                        </div>
                      </div>

                      {/* Potential treatments list */}
                      {potentialTreatments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[0.8125rem] font-semibold text-foreground-secondary uppercase tracking-wide">Servicios Planificados</h4>
                          {potentialTreatments.map((t) => {
                            const qty = t.quantity || 1;
                            const unitPrice = Number(t.estimated_amount);
                            const lineTotal = unitPrice * qty;
                            const paid = getTreatmentPaid(t.id);
                            const remaining = lineTotal - paid;
                            const paidPct = lineTotal > 0 ? Math.min(100, (paid / lineTotal) * 100) : 0;
                            const isFullyPaid = remaining <= 0.01;
                            const payments = treatmentPayments[t.id] || [];
                            const isExpanded = expandedTreatment === t.id;
                            return (
                            <div key={t.id} className={`rounded-[10px] border transition-all ${t.status === "completed" ? "border-success/30 bg-success/5" : "border-border"}`}>
                              <div className="flex items-center gap-3 p-4">
                                <button
                                  onClick={() => togglePotentialStatus(t)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                                    ${t.status === "completed" ? "bg-success border-success text-white" : "border-border hover:border-primary"}`}
                                >
                                  {t.status === "completed" && <Check className="w-3.5 h-3.5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[0.875rem] font-medium ${t.status === "completed" ? "text-foreground-secondary line-through" : "text-foreground"}`}>
                                    {t.service}
                                  </p>
                                  <p className="text-[0.75rem] text-foreground-secondary">
                                    {qty > 1 ? `${qty} × S/${unitPrice.toFixed(2)}` : `S/${unitPrice.toFixed(2)}`}
                                    {t.notes ? ` · ${t.notes}` : ""}
                                  </p>
                                  {/* Payment progress bar */}
                                  {lineTotal > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all ${isFullyPaid ? "bg-success" : "bg-primary"}`}
                                            style={{ width: `${paidPct}%` }}
                                          />
                                        </div>
                                        <span className="text-[0.6875rem] text-foreground-secondary whitespace-nowrap">{Math.round(paidPct)}%</span>
                                      </div>
                                      <p className="text-[0.6875rem] text-foreground-secondary">
                                        Pagado: <span className="font-medium text-success">S/{paid.toFixed(2)}</span>
                                        {" · "}Saldo: <span className={`font-medium ${isFullyPaid ? "text-success" : "text-warning"}`}>S/{Math.max(0, remaining).toFixed(2)}</span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className={`text-[0.875rem] font-semibold ${t.status === "completed" ? "text-success" : "text-primary"}`}>
                                    S/{lineTotal.toFixed(2)}
                                  </span>
                                  {/* Register payment button */}
                                  {!isFullyPaid && (
                                    <button
                                      onClick={() => {
                                        setPaymentForm({ amount: String(remaining.toFixed(2)), payment_method: "cash", notes: "" });
                                        setShowPaymentModal(t.id);
                                      }}
                                      aria-label="Registrar cobro"
                                      title="Registrar cobro"
                                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary/10 text-foreground-secondary hover:text-primary transition-colors"
                                    >
                                      <Banknote className="w-4 h-4" />
                                    </button>
                                  )}
                                  {/* Expand payment history */}
                                  {payments.length > 0 && (
                                    <button
                                      onClick={() => setExpandedTreatment(isExpanded ? null : t.id)}
                                      aria-label="Ver cobros"
                                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-alt text-foreground-secondary transition-colors"
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  <button onClick={() => setDeletingTreatmentId(t.id)} aria-label="Eliminar servicio"
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-danger/10 text-foreground-secondary hover:text-danger transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Payment history (expandable) */}
                              {isExpanded && payments.length > 0 && (
                                <div className="border-t border-border/50 px-4 py-3 bg-surface-alt/30">
                                  <p className="text-[0.6875rem] font-semibold text-foreground-secondary uppercase tracking-wide mb-2">Historial de Cobros</p>
                                  <div className="space-y-1.5">
                                    {payments.map(p => (
                                      <div key={p.id} className="flex items-center justify-between text-[0.75rem]">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                          <span className="text-foreground font-medium">S/{Number(p.amount).toFixed(2)}</span>
                                          <span className="text-foreground-secondary">
                                            — {PAYMENT_METHODS.find(m => m.value === p.payment_method)?.label || p.payment_method}
                                          </span>
                                          {p.notes && <span className="text-foreground-secondary">· {p.notes}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-foreground-secondary">{new Date(p.created_at).toLocaleDateString("es-PE")}</span>
                                          <button
                                            onClick={() => deletePayment(p.id)}
                                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-danger/10 text-foreground-secondary hover:text-danger transition-colors"
                                            aria-label="Eliminar cobro"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })}

                          {/* Totals summary */}
                          {(() => {
                            const totalPlanned = potentialTreatments.reduce((sum, t) => sum + Number(t.estimated_amount) * (t.quantity || 1), 0);
                            const totalPaid = potentialTreatments.reduce((sum, t) => sum + getTreatmentPaid(t.id), 0);
                            const totalRemaining = totalPlanned - totalPaid;
                            return (
                              <div className="space-y-2 mt-2">
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[10px] border border-primary/20">
                                  <span className="text-[0.875rem] font-semibold text-foreground">Total Planificado</span>
                                  <span className="text-[1.125rem] font-bold text-primary">S/{totalPlanned.toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center justify-between p-3 bg-success/5 rounded-[10px] border border-success/20">
                                    <span className="text-[0.8125rem] text-foreground-secondary">Cobrado</span>
                                    <span className="text-[0.9375rem] font-bold text-success">S/{totalPaid.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 bg-warning/5 rounded-[10px] border border-warning/20">
                                    <span className="text-[0.8125rem] text-foreground-secondary">Por Cobrar</span>
                                    <span className="text-[0.9375rem] font-bold text-warning">S/{Math.max(0, totalRemaining).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Performed services history */}
                      {performedServices.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[0.8125rem] font-semibold text-foreground-secondary uppercase tracking-wide">Historial de Servicios Realizados</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[0.8125rem]">
                              <thead>
                                <tr className="border-b border-border text-left">
                                  <th className="py-2 pr-4 font-semibold text-foreground-secondary">Servicio</th>
                                  <th className="py-2 pr-4 font-semibold text-foreground-secondary text-right">Monto</th>
                                  <th className="py-2 font-semibold text-foreground-secondary text-right">Fecha</th>
                                </tr>
                              </thead>
                              <tbody>
                                {performedServices.map(s => (
                                  <tr key={s.id} className="border-b border-border/50 last:border-0">
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                                        <span className="text-foreground font-medium">{s.service_name}</span>
                                        {s.quantity > 1 && <Badge variant="default">x{s.quantity}</Badge>}
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4 text-right font-semibold text-success whitespace-nowrap">
                                      S/{(Number(s.price) * s.quantity).toFixed(2)}
                                    </td>
                                    <td className="py-3 text-right text-foreground-secondary whitespace-nowrap">
                                      {s.date.split("-").reverse().join("/")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Total Facturado */}
                          <div className="flex items-center justify-between p-4 bg-success/5 rounded-[10px] border border-success/20 mt-2">
                            <span className="text-[0.875rem] font-semibold text-foreground">Total Facturado</span>
                            <span className="text-[1.125rem] font-bold text-success">
                              S/{performedServices.reduce((sum, s) => sum + Number(s.price) * s.quantity, 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Potential Treatment Modal */}
      <Modal open={showAddPotentialModal} onClose={() => setShowAddPotentialModal(false)} title="Agregar Servicio Potencial" size="md">
        <form onSubmit={handleAddPotential} className="space-y-4">
          <div>
            <label className={labelClass}>Servicio *</label>
            <select className={inputClass} value={potentialForm.service}
              onChange={e => {
                const svc = activeServices.find(s => s.name === e.target.value);
                setPotentialForm({
                  ...potentialForm,
                  service: e.target.value,
                  estimated_amount: svc ? String(svc.price) : potentialForm.estimated_amount,
                });
              }}>
              <option value="">Seleccionar servicio...</option>
              {activeServices.map(s => (
                <option key={s.id} value={s.name}>{s.name} — S/{Number(s.price).toFixed(2)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Precio Unitario (S/)</label>
              <input type="number" step="0.01" min="0" className={inputClass} placeholder="0.00"
                value={potentialForm.estimated_amount}
                onChange={e => setPotentialForm({ ...potentialForm, estimated_amount: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Cantidad</label>
              <input type="number" min="1" className={inputClass} placeholder="1"
                value={potentialForm.quantity}
                onChange={e => setPotentialForm({ ...potentialForm, quantity: e.target.value })} />
            </div>
          </div>
          {(() => {
            const price = parseFloat(potentialForm.estimated_amount) || 0;
            const qty = parseInt(potentialForm.quantity) || 1;
            const total = price * qty;
            return total > 0 ? (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-[10px] border border-primary/20">
                <span className="text-[0.8125rem] text-foreground-secondary">Total: {qty} × S/{price.toFixed(2)}</span>
                <span className="text-[1rem] font-bold text-primary">S/{total.toFixed(2)}</span>
              </div>
            ) : null;
          })()}
          <div>
            <label className={labelClass}>Notas</label>
            <textarea className={textareaClass} placeholder="Observaciones..."
              value={potentialForm.notes}
              onChange={e => setPotentialForm({ ...potentialForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowAddPotentialModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Guardando..." : "Agregar"}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Potential Treatment */}
      <Modal open={!!deletingTreatmentId} onClose={() => setDeletingTreatmentId(null)} title="Eliminar Servicio Potencial" size="sm">
        <div className="space-y-4">
          <p className="text-[0.875rem] text-foreground-secondary">
            ¿Estás seguro de que deseas eliminar este servicio potencial? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setDeletingTreatmentId(null)}>Cancelar</Button>
            <Button variant="danger" size="md" onClick={async () => {
              if (deletingTreatmentId) {
                await deletePotentialTreatment(deletingTreatmentId);
                setDeletingTreatmentId(null);
              }
            }}>Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!showPaymentModal} onClose={() => setShowPaymentModal(null)} title="Registrar Cobro" size="md">
        {(() => {
          const treatment = potentialTreatments.find(t => t.id === showPaymentModal);
          if (!treatment) return null;
          const total = Number(treatment.estimated_amount) * (treatment.quantity || 1);
          const paid = getTreatmentPaid(treatment.id);
          const remaining = total - paid;
          return (
            <form onSubmit={handleAddPayment} className="space-y-4">
              {/* Treatment info */}
              <div className="p-3 bg-surface-alt rounded-[10px]">
                <p className="text-[0.875rem] font-medium text-foreground">{treatment.service}</p>
                <div className="flex items-center gap-4 mt-1 text-[0.75rem] text-foreground-secondary">
                  <span>Total: <strong className="text-primary">S/{total.toFixed(2)}</strong></span>
                  <span>Pagado: <strong className="text-success">S/{paid.toFixed(2)}</strong></span>
                  <span>Saldo: <strong className="text-warning">S/{remaining.toFixed(2)}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Monto a cobrar (S/) *</label>
                  <input type="number" step="0.01" min="0.01" max={remaining} className={inputClass}
                    placeholder={remaining.toFixed(2)}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Método de pago</label>
                  <select className={inputClass} value={paymentForm.payment_method}
                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Notas</label>
                <textarea className={textareaClass} placeholder="Ej: Pago de primera cita..."
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="tertiary" size="md" onClick={() => setShowPaymentModal(null)} type="button">Cancelar</Button>
                <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Registrando..." : "Registrar Cobro"}</Button>
              </div>
            </form>
          );
        })()}
      </Modal>

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
            <div><label className={labelClass}>Hora *</label>
              <select className={inputClass} value={aptForm.start_time} onChange={e => setAptForm({ ...aptForm, start_time: e.target.value })}>
                {generateTimeSlots().map(t => <option key={t} value={t}>{to12h(t)}</option>)}
              </select>
            </div>
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
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary font-medium text-sm transition-colors"
          >
            <Mic className="w-4 h-4" /> Dictar con voz (Claude + Whisper)
          </button>
          {voiceExtras && (voiceExtras.prescripciones || voiceExtras.proxima_cita) && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[0.8125rem] text-amber-900">
              <p className="font-medium mb-1">Datos adicionales detectados (no se guardan automáticamente en este POC):</p>
              {voiceExtras.prescripciones && (
                <p>• Prescripciones: {voiceExtras.prescripciones.map(p => p.medicamento).join(", ")}</p>
              )}
              {voiceExtras.proxima_cita && (
                <p>• Próxima cita: {voiceExtras.proxima_cita.tipo || "Cita"} en {voiceExtras.proxima_cita.dias_desde_hoy ?? "?"} días</p>
              )}
            </div>
          )}
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

      <VoiceDictationModal
        open={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onApply={handleVoiceApply}
      />

    </div>
  );
}
