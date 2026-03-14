import { useState } from "react";
import { toast } from "sonner";
import { Edit2, Save, X, Shield } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { inputClass, labelClass } from "../../../components/modals/form-classes";
import type { PatientWithStats } from "../../../lib/types";

interface InsuranceTabProps {
  patient: PatientWithStats;
  onSave: (updates: Record<string, unknown>) => Promise<{ error: string | null }>;
  onRefetch: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function hasInsurance(patient: PatientWithStats): boolean {
  return !!(
    patient.insurance_company ||
    patient.insurance_plan ||
    patient.insurance_member_number ||
    patient.insurance_effective_date ||
    patient.insurance_expiry_date
  );
}

export function InsuranceTab({ patient, onSave, onRefetch }: InsuranceTabProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    insurance_company: "",
    insurance_plan: "",
    insurance_member_number: "",
    insurance_effective_date: "",
    insurance_expiry_date: "",
  });

  function openEdit() {
    setForm({
      insurance_company: patient.insurance_company || "",
      insurance_plan: patient.insurance_plan || "",
      insurance_member_number: patient.insurance_member_number || "",
      insurance_effective_date: patient.insurance_effective_date || "",
      insurance_expiry_date: patient.insurance_expiry_date || "",
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await onSave({
      insurance_company: form.insurance_company.trim() || null,
      insurance_plan: form.insurance_plan.trim() || null,
      insurance_member_number: form.insurance_member_number.trim() || null,
      insurance_effective_date: form.insurance_effective_date || null,
      insurance_expiry_date: form.insurance_expiry_date || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Seguro actualizado");
      setEditing(false);
      onRefetch();
    }
  }

  // ── Edit mode ──
  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Compania de Seguros</label>
            <input
              className={inputClass}
              value={form.insurance_company}
              onChange={(e) => setForm({ ...form, insurance_company: e.target.value })}
              placeholder="Ej. Mapfre, Rimac..."
            />
          </div>
          <div>
            <label className={labelClass}>Plan</label>
            <input
              className={inputClass}
              value={form.insurance_plan}
              onChange={(e) => setForm({ ...form, insurance_plan: e.target.value })}
              placeholder="Ej. Plan Premium"
            />
          </div>
          <div>
            <label className={labelClass}>Nro. de Afiliado</label>
            <input
              className={inputClass}
              value={form.insurance_member_number}
              onChange={(e) => setForm({ ...form, insurance_member_number: e.target.value })}
              placeholder="Ej. 0012345678"
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de Vigencia</label>
            <input
              type="date"
              className={inputClass}
              value={form.insurance_effective_date}
              onChange={(e) => setForm({ ...form, insurance_effective_date: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de Vencimiento</label>
            <input
              type="date"
              className={inputClass}
              value={form.insurance_expiry_date}
              onChange={(e) => setForm({ ...form, insurance_expiry_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="secondary" onClick={cancelEdit} disabled={saving}>
            <X className="w-4 h-4 mr-1.5" />
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  // ── Empty state ──
  if (!hasInsurance(patient)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center mb-4">
          <Shield className="w-7 h-7 text-foreground-secondary" />
        </div>
        <p className="text-foreground-secondary text-[0.875rem] mb-4">Sin seguro registrado</p>
        <Button onClick={openEdit}>Agregar Seguro</Button>
      </div>
    );
  }

  // ── Read mode ──
  const expired = isExpired(patient.insurance_expiry_date);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-[0.875rem] font-semibold text-foreground">Seguro Medico</h3>
          {patient.insurance_expiry_date && (
            <Badge variant={expired ? "danger" : "success"}>
              {expired ? "Vencido" : "Vigente"}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={openEdit}>
          <Edit2 className="w-4 h-4 mr-1.5" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        <div>
          <p className="text-[0.75rem] text-foreground-secondary mb-0.5">Compania de Seguros</p>
          <p className="text-[0.875rem] text-foreground">{patient.insurance_company || "—"}</p>
        </div>
        <div>
          <p className="text-[0.75rem] text-foreground-secondary mb-0.5">Plan</p>
          <p className="text-[0.875rem] text-foreground">{patient.insurance_plan || "—"}</p>
        </div>
        <div>
          <p className="text-[0.75rem] text-foreground-secondary mb-0.5">Nro. de Afiliado</p>
          <p className="text-[0.875rem] text-foreground">{patient.insurance_member_number || "—"}</p>
        </div>
        <div>
          <p className="text-[0.75rem] text-foreground-secondary mb-0.5">Fecha de Vigencia</p>
          <p className="text-[0.875rem] text-foreground">{formatDate(patient.insurance_effective_date)}</p>
        </div>
        <div>
          <p className="text-[0.75rem] text-foreground-secondary mb-0.5">Fecha de Vencimiento</p>
          <p className="text-[0.875rem] text-foreground">{formatDate(patient.insurance_expiry_date)}</p>
        </div>
      </div>
    </div>
  );
}
