import { useState } from "react";
import { toast } from "sonner";
import { Edit2, Save, X, Check } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { inputClass, labelClass, textareaClass } from "../../../components/modals/form-classes";
import { DENTAL_HYGIENE_OPTIONS } from "../../../lib/constants";
import type { PatientWithStats } from "../../../lib/types";

interface DentalTabProps {
  patient: PatientWithStats;
  onSave: (updates: Record<string, unknown>) => Promise<{ error: string | null }>;
  onRefetch: () => void;
}

interface FormState {
  bruxism: boolean;
  dental_sensitivity: boolean;
  bleeding_gums: boolean;
  orthodontic_history: boolean;
  dental_hygiene_frequency: string;
  last_dental_visit: string;
  previous_dental_treatments: string;
  dental_notes: string;
}

function buildFormState(patient: PatientWithStats): FormState {
  return {
    bruxism: patient.bruxism ?? false,
    dental_sensitivity: patient.dental_sensitivity ?? false,
    bleeding_gums: patient.bleeding_gums ?? false,
    orthodontic_history: patient.orthodontic_history ?? false,
    dental_hygiene_frequency: patient.dental_hygiene_frequency ?? "",
    last_dental_visit: patient.last_dental_visit ?? "",
    previous_dental_treatments: patient.previous_dental_treatments ?? "",
    dental_notes: patient.dental_notes ?? "",
  };
}

const HABIT_FIELDS: { key: keyof Pick<FormState, "bruxism" | "dental_sensitivity" | "bleeding_gums" | "orthodontic_history">; label: string }[] = [
  { key: "bruxism", label: "Bruxismo" },
  { key: "dental_sensitivity", label: "Sensibilidad dental" },
  { key: "bleeding_gums", label: "Sangrado de encías" },
  { key: "orthodontic_history", label: "Historial de ortodoncia" },
];

export function DentalTab({ patient, onSave, onRefetch }: DentalTabProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildFormState(patient));
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setForm(buildFormState(patient));
    setEditing(true);
  }

  function cancelEditing() {
    setForm(buildFormState(patient));
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);

    const updates: Record<string, unknown> = {
      bruxism: form.bruxism,
      dental_sensitivity: form.dental_sensitivity,
      bleeding_gums: form.bleeding_gums,
      orthodontic_history: form.orthodontic_history,
      dental_hygiene_frequency: form.dental_hygiene_frequency || null,
      last_dental_visit: form.last_dental_visit || null,
      previous_dental_treatments: form.previous_dental_treatments || null,
      dental_notes: form.dental_notes || null,
    };

    const { error } = await onSave(updates);
    setSaving(false);

    if (error) {
      toast.error("Error al guardar", { description: error });
      return;
    }

    toast.success("Antecedentes dentales actualizados");
    onRefetch();
    setEditing(false);
  }

  function toggleHabit(key: keyof Pick<FormState, "bruxism" | "dental_sensitivity" | "bleeding_gums" | "orthodontic_history">) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Read mode ──────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Antecedentes Dentales</h3>
          <Button variant="ghost" size="sm" onClick={startEditing}>
            <Edit2 size={15} className="mr-1.5" />
            Editar
          </Button>
        </div>

        {/* Hábitos Dentales */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-3">Hábitos Dentales</p>
            <div className="grid grid-cols-2 gap-3">
              {HABIT_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  {patient[key] ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600">
                      <Check size={13} />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-400">
                      <span className="w-2 h-0.5 bg-gray-400 rounded" />
                    </span>
                  )}
                  <span className="text-[0.8125rem] text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hygiene & Last Visit */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">Higiene Dental</p>
              <p className="text-[0.8125rem] text-foreground">
                {patient.dental_hygiene_frequency || "Sin registro"}
              </p>
            </div>
            <div>
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">Última Visita Dental</p>
              <p className="text-[0.8125rem] text-foreground">
                {patient.last_dental_visit
                  ? new Date(patient.last_dental_visit + "T00:00:00").toLocaleDateString("es-PE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Sin registro"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Text fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                Tratamientos Dentales Previos
              </p>
              <p className="text-[0.8125rem] text-foreground">
                {patient.previous_dental_treatments || "Sin registro"}
              </p>
            </div>
            <div>
              <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">Notas Odontológicas</p>
              <p className="text-[0.8125rem] text-foreground">{patient.dental_notes || "Sin registro"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Antecedentes Dentales</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
            <X size={15} className="mr-1.5" />
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={15} className="mr-1.5" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Hábitos Dentales */}
      <Card>
        <CardContent className="pt-6">
          <p className={labelClass}>Hábitos Dentales</p>
          <div className="grid grid-cols-2 gap-3">
            {HABIT_FIELDS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={() => toggleHabit(key)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[0.8125rem] text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hygiene & Last Visit */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className={labelClass}>Higiene Dental</label>
            <select
              className={inputClass}
              value={form.dental_hygiene_frequency}
              onChange={(e) => setForm((prev) => ({ ...prev, dental_hygiene_frequency: e.target.value }))}
            >
              <option value="">Seleccionar frecuencia</option>
              {DENTAL_HYGIENE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Última Visita Dental</label>
            <input
              type="date"
              className={inputClass}
              value={form.last_dental_visit}
              onChange={(e) => setForm((prev) => ({ ...prev, last_dental_visit: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Textareas */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className={labelClass}>Tratamientos Dentales Previos</label>
            <textarea
              className={textareaClass}
              value={form.previous_dental_treatments}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, previous_dental_treatments: e.target.value }))
              }
              placeholder="Tratamientos dentales realizados anteriormente"
            />
          </div>
          <div>
            <label className={labelClass}>Notas Odontológicas</label>
            <textarea
              className={textareaClass}
              value={form.dental_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, dental_notes: e.target.value }))}
              placeholder="Notas adicionales sobre la salud dental"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
