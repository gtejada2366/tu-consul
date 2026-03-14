import { useState } from "react";
import { toast } from "sonner";
import { Edit2, Save, X, Check, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { inputClass, labelClass, textareaClass } from "../../../components/modals/form-classes";
import { CHRONIC_CONDITIONS_OPTIONS } from "../../../lib/constants";
import type { PatientWithStats } from "../../../lib/types";

interface MedicalTabProps {
  patient: PatientWithStats;
  onSave: (updates: Record<string, unknown>) => Promise<{ error: string | null }>;
  onRefetch: () => void;
}

interface FormState {
  chronic_conditions: string[];
  allergies: string;
  current_medications: string;
  previous_surgeries: string;
  hospitalizations: string;
  family_history: string;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  smoking: boolean;
  alcohol_consumption: boolean;
}

function buildFormState(patient: PatientWithStats): FormState {
  return {
    chronic_conditions: patient.chronic_conditions ?? [],
    allergies: (patient.allergies ?? []).join(", "),
    current_medications: patient.current_medications ?? "",
    previous_surgeries: patient.previous_surgeries ?? "",
    hospitalizations: patient.hospitalizations ?? "",
    family_history: patient.family_history ?? "",
    is_pregnant: patient.is_pregnant ?? false,
    is_breastfeeding: patient.is_breastfeeding ?? false,
    smoking: patient.smoking ?? false,
    alcohol_consumption: patient.alcohol_consumption ?? false,
  };
}

const HABIT_FIELDS: { key: keyof Pick<FormState, "is_pregnant" | "is_breastfeeding" | "smoking" | "alcohol_consumption">; label: string }[] = [
  { key: "is_pregnant", label: "Embarazo" },
  { key: "is_breastfeeding", label: "Lactancia" },
  { key: "smoking", label: "Tabaquismo" },
  { key: "alcohol_consumption", label: "Consumo de alcohol" },
];

export function MedicalTab({ patient, onSave, onRefetch }: MedicalTabProps) {
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
    const allergiesArray = form.allergies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updates: Record<string, unknown> = {
      chronic_conditions: form.chronic_conditions,
      allergies: allergiesArray,
      current_medications: form.current_medications || null,
      previous_surgeries: form.previous_surgeries || null,
      hospitalizations: form.hospitalizations || null,
      family_history: form.family_history || null,
      is_pregnant: form.is_pregnant,
      is_breastfeeding: form.is_breastfeeding,
      smoking: form.smoking,
      alcohol_consumption: form.alcohol_consumption,
    };

    const { error } = await onSave(updates);
    setSaving(false);

    if (error) {
      toast.error("Error al guardar", { description: error });
      return;
    }

    toast.success("Antecedentes médicos actualizados");
    onRefetch();
    setEditing(false);
  }

  function toggleCondition(condition: string) {
    setForm((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions.includes(condition)
        ? prev.chronic_conditions.filter((c) => c !== condition)
        : [...prev.chronic_conditions, condition],
    }));
  }

  function toggleHabit(key: keyof Pick<FormState, "is_pregnant" | "is_breastfeeding" | "smoking" | "alcohol_consumption">) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Read mode ──────────────────────────────────────────────
  if (!editing) {
    const conditions = patient.chronic_conditions ?? [];
    const allergies = patient.allergies ?? [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Antecedentes Médicos</h3>
          <Button variant="ghost" size="sm" onClick={startEditing}>
            <Edit2 size={15} className="mr-1.5" />
            Editar
          </Button>
        </div>

        {/* Condiciones Crónicas */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Condiciones Crónicas</p>
            {conditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-medium bg-green-50 text-green-700 border border-green-200"
                  >
                    <AlertCircle size={12} />
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[0.8125rem] text-foreground-secondary">Sin registro</p>
            )}
          </CardContent>
        </Card>

        {/* Alergias */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Alergias</p>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.75rem] font-medium bg-red-50 text-red-700 border border-red-200"
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[0.8125rem] text-foreground-secondary">Sin registro</p>
            )}
          </CardContent>
        </Card>

        {/* Text fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <ReadField label="Medicamentos Actuales" value={patient.current_medications} />
            <ReadField label="Cirugías Previas" value={patient.previous_surgeries} />
            <ReadField label="Hospitalizaciones" value={patient.hospitalizations} />
            <ReadField label="Antecedentes Familiares" value={patient.family_history} />
          </CardContent>
        </Card>

        {/* Hábitos y Condiciones */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-3">Hábitos y Condiciones</p>
            <div className="grid grid-cols-2 gap-3">
              {HABIT_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  {patient[key] ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600">
                      <Check size={13} />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500">
                      <X size={13} />
                    </span>
                  )}
                  <span className="text-[0.8125rem] text-foreground">{label}</span>
                </div>
              ))}
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
        <h3 className="text-lg font-semibold text-foreground">Antecedentes Médicos</h3>
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

      {/* Condiciones Crónicas */}
      <Card>
        <CardContent className="pt-6">
          <p className={labelClass}>Condiciones Crónicas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHRONIC_CONDITIONS_OPTIONS.map((condition) => (
              <label key={condition} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.chronic_conditions.includes(condition)}
                  onChange={() => toggleCondition(condition)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[0.8125rem] text-foreground">{condition}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alergias */}
      <Card>
        <CardContent className="pt-6">
          <label className={labelClass}>Alergias (separadas por coma)</label>
          <input
            type="text"
            className={inputClass}
            value={form.allergies}
            onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value }))}
            placeholder="Ej: Penicilina, Látex, Polen"
          />
        </CardContent>
      </Card>

      {/* Textareas */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className={labelClass}>Medicamentos Actuales</label>
            <textarea
              className={textareaClass}
              value={form.current_medications}
              onChange={(e) => setForm((prev) => ({ ...prev, current_medications: e.target.value }))}
              placeholder="Medicamentos que toma actualmente"
            />
          </div>
          <div>
            <label className={labelClass}>Cirugías Previas</label>
            <textarea
              className={textareaClass}
              value={form.previous_surgeries}
              onChange={(e) => setForm((prev) => ({ ...prev, previous_surgeries: e.target.value }))}
              placeholder="Cirugías realizadas anteriormente"
            />
          </div>
          <div>
            <label className={labelClass}>Hospitalizaciones</label>
            <textarea
              className={textareaClass}
              value={form.hospitalizations}
              onChange={(e) => setForm((prev) => ({ ...prev, hospitalizations: e.target.value }))}
              placeholder="Hospitalizaciones previas"
            />
          </div>
          <div>
            <label className={labelClass}>Antecedentes Familiares</label>
            <textarea
              className={textareaClass}
              value={form.family_history}
              onChange={(e) => setForm((prev) => ({ ...prev, family_history: e.target.value }))}
              placeholder="Enfermedades relevantes en la familia"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hábitos y Condiciones */}
      <Card>
        <CardContent className="pt-6">
          <p className={labelClass}>Hábitos y Condiciones</p>
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
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────
function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">{label}</p>
      <p className="text-[0.8125rem] text-foreground">{value || "Sin registro"}</p>
    </div>
  );
}
