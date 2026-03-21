import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import {
  Plus,
  Search,
  ChevronRight,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { usePatients, usePatientMutations } from "../hooks/use-patients";
import { inputClass, labelClass } from "../components/modals/form-classes";
import { BLOOD_TYPES, INTEREST_TAGS, getTagColor } from "../lib/constants";

export function Patients() {
  const [searchParams] = useSearchParams();
  const { patients, loading, refetch } = usePatients();
  const { createPatient } = usePatientMutations();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [tagFilter, setTagFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", address: "", birthdate: "", blood_type: "", allergies: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredPatients = useMemo(() => patients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone || "").includes(searchTerm);
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const matchesTag = !tagFilter || (patient.interest_tags ?? []).includes(tagFilter);
    return matchesSearch && matchesStatus && matchesTag;
  }), [patients, searchTerm, statusFilter, tagFilter]);

  function resetForm() {
    setForm({ full_name: "", email: "", phone: "", address: "", birthdate: "", blood_type: "", allergies: "" });
    setFormErrors({});
  }

  function validateField(field: string, value: string) {
    const errors = { ...formErrors };
    if (field === "full_name") {
      errors.full_name = value.trim() ? "" : "El nombre es obligatorio";
    }
    if (field === "email" && value.trim()) {
      errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "Formato de email inválido";
    } else if (field === "email") {
      errors.email = "";
    }
    if (field === "birthdate" && value) {
      errors.birthdate = new Date(value) > new Date() ? "No puede ser fecha futura" : "";
    }
    setFormErrors(errors);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = "El nombre es obligatorio";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = "Formato de email inválido";
    if (form.birthdate && new Date(form.birthdate) > new Date()) errors.birthdate = "No puede ser fecha futura";
    if (Object.values(errors).some(e => e)) { setFormErrors(errors); return; }
    setSaving(true);
    const { error } = await createPatient({
      full_name: form.full_name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      birthdate: form.birthdate || undefined,
      blood_type: form.blood_type || undefined,
      allergies: form.allergies.trim() ? form.allergies.split(",").map(a => a.trim()) : [],
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Paciente creado"); setShowCreateModal(false); resetForm(); refetch(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Pacientes</h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">{filteredPatients.length} pacientes registrados</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />Nuevo Paciente
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
              <input type="text" placeholder="Buscar paciente por nombre, email o teléfono..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} aria-label="Buscar pacientes"
                className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150" />
            </div>
            <select
              className="h-10 px-3 bg-surface-alt border border-border rounded-[10px] text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filtrar por tag"
            >
              <option value="">Todos los tags</option>
              {INTEREST_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              {(["all", "active", "inactive"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`h-10 px-3 text-[0.8125rem] font-medium rounded-[10px] transition-all ${statusFilter === s ? "bg-primary text-white" : "bg-surface-alt text-foreground-secondary hover:text-foreground"}`}>
                  {s === "all" ? "Todos" : s === "active" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? <Loading /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-alt border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Paciente</th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Contacto</th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Última Visita</th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Visitas Totales</th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Tags</th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Estado</th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-surface-alt transition-colors duration-150">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground text-[0.875rem]">{patient.full_name}</p>
                          <p className="text-[0.75rem] text-foreground-secondary">{patient.age ?? "-"} años</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[0.75rem] text-foreground-secondary"><Mail className="w-3.5 h-3.5" /><span>{patient.email || "-"}</span></div>
                            <div className="flex items-center gap-2 text-[0.75rem] text-foreground-secondary"><Phone className="w-3.5 h-3.5" /><span>{patient.phone || "-"}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-foreground-secondary" />
                            <span className="text-[0.875rem] text-foreground">
                              {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : "Sin visitas"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-[0.875rem] font-semibold text-foreground">{patient.total_visits}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(patient.interest_tags ?? []).slice(0, 3).map(tag => {
                              const color = getTagColor(tag);
                              return (
                                <span key={tag} className={`inline-block px-2 py-0.5 rounded-full text-[0.625rem] font-medium border ${color.bg} ${color.text} ${color.border}`}>{tag}</span>
                              );
                            })}
                            {(patient.interest_tags ?? []).length > 3 && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-gray-100 text-gray-600">+{(patient.interest_tags ?? []).length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={patient.status === "active" ? "success" : "secondary"}>
                            {patient.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/pacientes/${patient.id}`}>
                            <Button variant="ghost" size="sm">Ver<ChevronRight className="w-4 h-4 ml-1" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPatients.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                  <p className="text-[0.875rem] text-foreground-secondary">
                    {searchTerm || statusFilter !== "all" || tagFilter
                      ? "No se encontraron pacientes con esos filtros"
                      : "Aún no hay pacientes registrados"}
                  </p>
                  {!searchTerm && statusFilter === "all" && !tagFilter && (
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowCreateModal(true)}>
                      <Plus className="w-4 h-4 mr-1" />Agregar primer paciente
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Paciente" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre Completo *</label>
            <input type="text" className={`${inputClass} ${formErrors.full_name ? "!border-danger" : ""}`} placeholder="Nombre y apellido" value={form.full_name}
              onChange={e => { setForm({ ...form, full_name: e.target.value }); validateField("full_name", e.target.value); }} />
            {formErrors.full_name && <p className="text-[0.75rem] text-danger mt-1">{formErrors.full_name}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={`${inputClass} ${formErrors.email ? "!border-danger" : ""}`} placeholder="correo@ejemplo.com" value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); validateField("email", e.target.value); }} />
              {formErrors.email && <p className="text-[0.75rem] text-danger mt-1">{formErrors.email}</p>}
            </div>
            <div><label className={labelClass}>Teléfono</label><input type="tel" className={inputClass} placeholder="+51 999 999 999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>Dirección</label><input type="text" className={inputClass} placeholder="Av. Principal 1234" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de Nacimiento</label>
              <input type="date" className={`${inputClass} ${formErrors.birthdate ? "!border-danger" : ""}`} value={form.birthdate}
                onChange={e => { setForm({ ...form, birthdate: e.target.value }); validateField("birthdate", e.target.value); }} />
              {formErrors.birthdate && <p className="text-[0.75rem] text-danger mt-1">{formErrors.birthdate}</p>}
            </div>
            <div>
              <label className={labelClass}>Grupo Sanguíneo</label>
              <select className={inputClass} value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })}>
                <option value="">Seleccionar</option>
                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Alergias (separadas por coma)</label><input type="text" className={inputClass} placeholder="Penicilina, Látex..." value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowCreateModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Guardando..." : "Crear Paciente"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
