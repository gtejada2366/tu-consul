import { useState } from "react";
import { toast } from "sonner";
import { Edit2, Save, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { inputClass, labelClass } from "../../../components/modals/form-classes";
import {
  DOCUMENT_TYPES,
  GENDERS,
  MARITAL_STATUSES,
  EDUCATION_LEVELS,
  BLOOD_TYPES,
} from "../../../lib/constants";
import type { PatientWithStats } from "../../../lib/types";

interface PersonalDataTabProps {
  patient: PatientWithStats;
  onSave: (updates: Record<string, unknown>) => Promise<{ error: string | null }>;
  onRefetch: () => void;
}

const initialForm = (p: PatientWithStats) => ({
  full_name: p.full_name,
  document_type: p.document_type || "",
  document_number: p.document_number || "",
  gender: p.gender || "",
  birthdate: p.birthdate || "",
  marital_status: p.marital_status || "",
  occupation: p.occupation || "",
  nationality: p.nationality || "Peruana",
  education_level: p.education_level || "",
  blood_type: p.blood_type || "",
});

export function PersonalDataTab({ patient, onSave, onRefetch }: PersonalDataTabProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => initialForm(patient));

  function handleEdit() {
    setForm(initialForm(patient));
    setEditing(true);
  }

  function handleCancel() {
    setForm(initialForm(patient));
    setEditing(false);
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      toast.error("El nombre completo es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await onSave({
      full_name: form.full_name.trim(),
      document_type: form.document_type || null,
      document_number: form.document_number.trim() || null,
      gender: form.gender || null,
      birthdate: form.birthdate || null,
      marital_status: form.marital_status || null,
      occupation: form.occupation.trim() || null,
      nationality: form.nationality.trim() || null,
      education_level: form.education_level || null,
      blood_type: form.blood_type || null,
    } as Record<string, unknown>);
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Datos personales actualizados");
      onRefetch();
      setEditing(false);
    }
  }

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ---- READ MODE ----
  if (!editing) {
    const fields: { label: string; value: string | null | undefined }[] = [
      { label: "Nombre Completo", value: patient.full_name },
      { label: "Tipo de Documento", value: patient.document_type },
      { label: "Nro. Documento", value: patient.document_number },
      { label: "Género", value: patient.gender },
      {
        label: "Fecha de Nacimiento",
        value: patient.birthdate
          ? new Date(patient.birthdate).toLocaleDateString("es-ES")
          : null,
      },
      { label: "Estado Civil", value: patient.marital_status },
      { label: "Ocupación", value: patient.occupation },
      { label: "Nacionalidad", value: patient.nationality },
      { label: "Nivel Educativo", value: patient.education_level },
      { label: "Grupo Sanguíneo", value: patient.blood_type },
    ];

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Datos Personales</h3>
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                {f.label}
              </p>
              <p className="text-[0.875rem] text-foreground">{f.value || "-"}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- EDIT MODE ----
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Datos Personales</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Nombre Completo */}
        <div>
          <label className={labelClass}>Nombre Completo *</label>
          <input
            type="text"
            className={inputClass}
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            required
          />
        </div>

        {/* Tipo de Documento */}
        <div>
          <label className={labelClass}>Tipo de Documento</label>
          <select
            className={inputClass}
            value={form.document_type}
            onChange={(e) => set("document_type", e.target.value)}
          >
            <option value="">Seleccionar</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Nro. Documento */}
        <div>
          <label className={labelClass}>Nro. Documento</label>
          <input
            type="text"
            className={inputClass}
            value={form.document_number}
            onChange={(e) => set("document_number", e.target.value)}
          />
        </div>

        {/* Género */}
        <div>
          <label className={labelClass}>Género</label>
          <select
            className={inputClass}
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="">Seleccionar</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label className={labelClass}>Fecha de Nacimiento</label>
          <input
            type="date"
            className={inputClass}
            value={form.birthdate}
            onChange={(e) => set("birthdate", e.target.value)}
          />
        </div>

        {/* Estado Civil */}
        <div>
          <label className={labelClass}>Estado Civil</label>
          <select
            className={inputClass}
            value={form.marital_status}
            onChange={(e) => set("marital_status", e.target.value)}
          >
            <option value="">Seleccionar</option>
            {MARITAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Ocupación */}
        <div>
          <label className={labelClass}>Ocupación</label>
          <input
            type="text"
            className={inputClass}
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
          />
        </div>

        {/* Nacionalidad */}
        <div>
          <label className={labelClass}>Nacionalidad</label>
          <input
            type="text"
            className={inputClass}
            value={form.nationality}
            onChange={(e) => set("nationality", e.target.value)}
          />
        </div>

        {/* Nivel Educativo */}
        <div>
          <label className={labelClass}>Nivel Educativo</label>
          <select
            className={inputClass}
            value={form.education_level}
            onChange={(e) => set("education_level", e.target.value)}
          >
            <option value="">Seleccionar</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Grupo Sanguíneo */}
        <div>
          <label className={labelClass}>Grupo Sanguíneo</label>
          <select
            className={inputClass}
            value={form.blood_type}
            onChange={(e) => set("blood_type", e.target.value)}
          >
            <option value="">Seleccionar</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
