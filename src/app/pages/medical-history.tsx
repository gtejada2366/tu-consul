import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import { ArrowLeft, Plus, FileText, Pill, Microscope, Download, Calendar, Trash2 } from "lucide-react";
import { usePatient } from "../hooks/use-patients";
import { toLocalDateStr } from "../lib/constants";
import { useMedicalHistory, useConsultationMutations } from "../hooks/use-medical-history";
import { inputClass, labelClass, textareaClass } from "../components/modals/form-classes";

const typeConfig = {
  consulta: { icon: FileText, color: "text-primary", bgColor: "bg-primary/10", label: "Consulta", badgeVariant: "primary" as const },
  prescription: { icon: Pill, color: "text-success", bgColor: "bg-success/10", label: "Receta", badgeVariant: "success" as const },
  lab: { icon: Microscope, color: "text-warning", bgColor: "bg-warning/10", label: "Laboratorio", badgeVariant: "warning" as const },
};

export function MedicalHistory() {
  const { id } = useParams();
  const { patient } = usePatient(id);
  const { consultations, loading, refetch } = useMedicalHistory(id);
  const { createConsultation } = useConsultationMutations();

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formType, setFormType] = useState<"consulta" | "prescription" | "lab">("consulta");
  const [conForm, setConForm] = useState({ title: "", description: "", blood_pressure: "", temperature: "", weight: "", height: "", diagnosis: "" });
  const [prescriptions, setPrescriptions] = useState([{ medication_name: "", dosage: "", duration: "" }]);
  const [labResults, setLabResults] = useState([{ test_name: "", result: "", status: "normal" as "normal" | "abnormal" }]);

  function resetForm() {
    setConForm({ title: "", description: "", blood_pressure: "", temperature: "", weight: "", height: "", diagnosis: "" });
    setPrescriptions([{ medication_name: "", dosage: "", duration: "" }]);
    setLabResults([{ test_name: "", result: "", status: "normal" }]);
    setFormType("consulta");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    let title = conForm.title.trim();
    if (!title) {
      if (formType === "prescription") title = "Receta Médica";
      else if (formType === "lab") title = "Resultados de Laboratorio";
      else { toast.error("El título es obligatorio"); return; }
    }
    setSaving(true);
    const { error } = await createConsultation({
      patient_id: id, type: formType, title,
      description: formType === "consulta" ? conForm.description.trim() || undefined : undefined,
      blood_pressure: formType === "consulta" ? conForm.blood_pressure.trim() || undefined : undefined,
      temperature: formType === "consulta" ? conForm.temperature.trim() || undefined : undefined,
      weight: formType === "consulta" ? conForm.weight.trim() || undefined : undefined,
      height: formType === "consulta" ? conForm.height.trim() || undefined : undefined,
      diagnosis: formType === "consulta" ? conForm.diagnosis.trim() || undefined : undefined,
      prescriptions: formType === "prescription" ? prescriptions.filter(p => p.medication_name.trim()) : undefined,
      lab_results: formType === "lab" ? labResults.filter(r => r.test_name.trim()) : undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Registro creado"); setShowModal(false); resetForm(); refetch(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/pacientes/${id}`}><Button variant="ghost" size="md"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
          <div>
            <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Historia Clínica</h1>
            <p className="text-[0.875rem] text-foreground-secondary mt-1">{patient?.full_name ?? "Paciente no encontrado"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="tertiary" size="md" onClick={() => {
            if (consultations.length === 0) { toast.error("No hay registros para exportar"); return; }
            const header = "Fecha,Tipo,Título,Diagnóstico,Descripción\n";
            const rows = consultations.map(c =>
              `"${c.date}","${c.type}","${c.title}","${c.diagnosis || '-'}","${(c.description || '-').replace(/"/g, '""')}"`
            ).join("\n");
            const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `historia_${patient?.full_name?.replace(/\s/g, '_') || 'paciente'}_${toLocalDateStr(new Date())}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success("CSV exportado");
          }}><Download className="w-4 h-4 mr-2" />Exportar</Button>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" />Nueva Evolución</Button>
        </div>
      </div>

      {patient && (
        <Card><div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Edad</p><p className="text-[0.875rem] font-semibold text-foreground">{patient.age ?? "-"} años</p></div>
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Grupo Sanguíneo</p><p className="text-[0.875rem] font-semibold text-foreground">{patient.blood_type || "-"}</p></div>
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Alergias</p>
              <div className="flex flex-wrap gap-1">{patient.allergies.length > 0 ? patient.allergies.map((a, i) => <Badge key={i} variant="danger" className="text-[0.65rem]">{a}</Badge>) : <span className="text-[0.875rem] text-foreground-secondary">Ninguna</span>}</div></div>
            <div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">Total de Consultas</p><p className="text-[0.875rem] font-semibold text-foreground">{patient.total_visits}</p></div>
          </div>
        </div></Card>
      )}

      <Card><CardHeader><CardTitle>Línea de Tiempo Clínica</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loading /> : consultations.length === 0 ? (
            <p className="text-[0.875rem] text-foreground-secondary text-center py-12">No hay registros en la historia clínica</p>
          ) : (
            <div className="space-y-6">
              {consultations.map((event, index) => {
                const config = typeConfig[event.type as keyof typeof typeConfig] || typeConfig.consulta;
                const Icon = config.icon;
                return (
                  <div key={event.id} className="relative">
                    {index < consultations.length - 1 && <div className="absolute left-6 top-14 w-0.5 h-full bg-border -z-10"></div>}
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-[10px] ${config.bgColor} flex items-center justify-center flex-shrink-0`}><Icon className={`w-6 h-6 ${config.color}`} /></div>
                      <div className="flex-1">
                        <div className="bg-surface border border-border rounded-[12px] p-5 hover:shadow-md transition-shadow duration-150">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-foreground">{event.title}</h3><Badge variant={config.badgeVariant}>{config.label}</Badge></div>
                              <div className="flex items-center gap-3 text-[0.75rem] text-foreground-secondary">
                                <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{(() => { const [y,m,d] = event.date.split("-"); const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]; return `${d} de ${months[parseInt(m)-1]} de ${y}`; })()}</div>
                                {event.time && <><span>•</span><span>{event.time.slice(0, 5)}</span></>}
                              </div>
                            </div>
                          </div>
                          {event.type === "consulta" && (<>
                            {event.description && <p className="text-[0.875rem] text-foreground mb-4">{event.description}</p>}
                            {(event.blood_pressure || event.temperature || event.weight) && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-alt rounded-[10px]">
                                {event.blood_pressure && <div><p className="text-[0.65rem] font-medium text-foreground-secondary mb-0.5">Presión Arterial</p><p className="text-[0.875rem] font-semibold text-foreground">{event.blood_pressure}</p></div>}
                                {event.temperature && <div><p className="text-[0.65rem] font-medium text-foreground-secondary mb-0.5">Temperatura</p><p className="text-[0.875rem] font-semibold text-foreground">{event.temperature}</p></div>}
                                {event.weight && <div><p className="text-[0.65rem] font-medium text-foreground-secondary mb-0.5">Peso</p><p className="text-[0.875rem] font-semibold text-foreground">{event.weight}</p></div>}
                                {event.height && <div><p className="text-[0.65rem] font-medium text-foreground-secondary mb-0.5">Altura</p><p className="text-[0.875rem] font-semibold text-foreground">{event.height}</p></div>}
                              </div>)}
                          </>)}
                          {event.type === "prescription" && event.prescriptions?.length > 0 && (
                            <div className="space-y-2">{event.prescriptions.map((med, idx) => (
                              <div key={idx} className="p-3 bg-surface-alt rounded-[10px]"><p className="font-semibold text-foreground text-[0.875rem] mb-1">{med.medication_name}</p><p className="text-[0.75rem] text-foreground-secondary">{med.dosage} • {med.duration}</p></div>
                            ))}</div>)}
                          {event.type === "lab" && event.lab_results?.length > 0 && (
                            <div className="space-y-2">{event.lab_results.map((result, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-surface-alt rounded-[10px]">
                                <div><p className="font-semibold text-foreground text-[0.875rem]">{result.test_name}</p><p className="text-[0.75rem] text-foreground-secondary">{result.result}</p></div>
                                <Badge variant={result.status === "normal" ? "success" : "warning"}>{result.status === "normal" ? "Normal" : "Alterado"}</Badge>
                              </div>
                            ))}</div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Evolución" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de Registro</label>
            <div className="flex gap-2">
              {(["consulta", "prescription", "lab"] as const).map(t => (
                <button key={t} type="button" onClick={() => setFormType(t)}
                  className={`flex-1 px-3 py-2 text-[0.75rem] font-medium rounded-[10px] transition-all ${formType === t ? (t === "consulta" ? "bg-primary text-white" : t === "prescription" ? "bg-success text-white" : "bg-warning text-white") : "bg-surface-alt text-foreground-secondary hover:text-foreground"}`}>
                  {t === "consulta" ? "Consulta" : t === "prescription" ? "Receta" : "Laboratorio"}
                </button>
              ))}
            </div>
          </div>

          {formType === "consulta" && (<>
            <div><label className={labelClass}>Título *</label><input type="text" className={inputClass} placeholder="Ej: Consulta de control" value={conForm.title} onChange={e => setConForm({ ...conForm, title: e.target.value })} /></div>
            <div><label className={labelClass}>Descripción</label><textarea className={textareaClass} placeholder="Descripción..." value={conForm.description} onChange={e => setConForm({ ...conForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={labelClass}>Presión</label><input type="text" className={inputClass} placeholder="120/80" value={conForm.blood_pressure} onChange={e => setConForm({ ...conForm, blood_pressure: e.target.value })} /></div>
              <div><label className={labelClass}>Temp.</label><input type="text" className={inputClass} placeholder="36.5°C" value={conForm.temperature} onChange={e => setConForm({ ...conForm, temperature: e.target.value })} /></div>
              <div><label className={labelClass}>Peso</label><input type="text" className={inputClass} placeholder="70kg" value={conForm.weight} onChange={e => setConForm({ ...conForm, weight: e.target.value })} /></div>
              <div><label className={labelClass}>Altura</label><input type="text" className={inputClass} placeholder="170cm" value={conForm.height} onChange={e => setConForm({ ...conForm, height: e.target.value })} /></div>
            </div>
            <div><label className={labelClass}>Diagnóstico</label><textarea className={textareaClass} placeholder="Diagnóstico..." value={conForm.diagnosis} onChange={e => setConForm({ ...conForm, diagnosis: e.target.value })} /></div>
          </>)}

          {formType === "prescription" && (<>
            <div><label className={labelClass}>Título</label><input type="text" className={inputClass} placeholder="Receta Médica" value={conForm.title} onChange={e => setConForm({ ...conForm, title: e.target.value })} /></div>
            <div className="space-y-3">
              <label className={labelClass}>Medicamentos</label>
              {prescriptions.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input type="text" className={inputClass} placeholder="Nombre del medicamento" value={p.medication_name} onChange={e => { const arr = [...prescriptions]; arr[idx] = { ...arr[idx], medication_name: e.target.value }; setPrescriptions(arr); }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" className={inputClass} placeholder="Dosis" value={p.dosage} onChange={e => { const arr = [...prescriptions]; arr[idx] = { ...arr[idx], dosage: e.target.value }; setPrescriptions(arr); }} />
                      <input type="text" className={inputClass} placeholder="Duración" value={p.duration} onChange={e => { const arr = [...prescriptions]; arr[idx] = { ...arr[idx], duration: e.target.value }; setPrescriptions(arr); }} />
                    </div>
                  </div>
                  {prescriptions.length > 1 && <button type="button" onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="mt-2 p-2 text-foreground-secondary hover:text-danger"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
              <Button type="button" variant="tertiary" size="sm" onClick={() => setPrescriptions([...prescriptions, { medication_name: "", dosage: "", duration: "" }])}><Plus className="w-3 h-3 mr-1" />Agregar Medicamento</Button>
            </div>
          </>)}

          {formType === "lab" && (<>
            <div><label className={labelClass}>Título</label><input type="text" className={inputClass} placeholder="Resultados de Laboratorio" value={conForm.title} onChange={e => setConForm({ ...conForm, title: e.target.value })} /></div>
            <div className="space-y-3">
              <label className={labelClass}>Estudios</label>
              {labResults.map((r, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input type="text" className={inputClass} placeholder="Nombre del estudio" value={r.test_name} onChange={e => { const arr = [...labResults]; arr[idx] = { ...arr[idx], test_name: e.target.value }; setLabResults(arr); }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" className={inputClass} placeholder="Resultado" value={r.result} onChange={e => { const arr = [...labResults]; arr[idx] = { ...arr[idx], result: e.target.value }; setLabResults(arr); }} />
                      <select className={inputClass} value={r.status} onChange={e => { const arr = [...labResults]; arr[idx] = { ...arr[idx], status: e.target.value as "normal" | "abnormal" }; setLabResults(arr); }}>
                        <option value="normal">Normal</option><option value="abnormal">Alterado</option>
                      </select>
                    </div>
                  </div>
                  {labResults.length > 1 && <button type="button" onClick={() => setLabResults(labResults.filter((_, i) => i !== idx))} className="mt-2 p-2 text-foreground-secondary hover:text-danger"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
              <Button type="button" variant="tertiary" size="sm" onClick={() => setLabResults([...labResults, { test_name: "", result: "", status: "normal" }])}><Plus className="w-3 h-3 mr-1" />Agregar Estudio</Button>
            </div>
          </>)}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar Registro"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
