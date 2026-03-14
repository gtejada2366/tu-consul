import { useState } from "react";
import { toast } from "sonner";
import { Edit2, Save, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { inputClass, labelClass } from "../../../components/modals/form-classes";
import { RELATIONSHIPS } from "../../../lib/constants";
import type { PatientWithStats } from "../../../lib/types";

interface ContactTabProps {
  patient: PatientWithStats;
  onSave: (updates: Record<string, unknown>) => Promise<{ error: string | null }>;
  onRefetch: () => void;
}

const initialForm = (p: PatientWithStats) => ({
  phone: p.phone || "",
  phone_mobile: p.phone_mobile || "",
  email: p.email || "",
  address: p.address || "",
  city: p.city || "",
  district: p.district || "",
  address_reference: p.address_reference || "",
  emergency_contact_name: p.emergency_contact_name || "",
  emergency_contact_relationship: p.emergency_contact_relationship || "",
  emergency_contact_phone: p.emergency_contact_phone || "",
});

export function ContactTab({ patient, onSave, onRefetch }: ContactTabProps) {
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
    setSaving(true);
    const { error } = await onSave({
      phone: form.phone.trim() || null,
      phone_mobile: form.phone_mobile.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      district: form.district.trim() || null,
      address_reference: form.address_reference.trim() || null,
      emergency_contact_name: form.emergency_contact_name.trim() || null,
      emergency_contact_relationship: form.emergency_contact_relationship || null,
      emergency_contact_phone: form.emergency_contact_phone.trim() || null,
    } as Record<string, unknown>);
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Información de contacto actualizada");
      onRefetch();
      setEditing(false);
    }
  }

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ---- READ MODE ----
  if (!editing) {
    const contactFields: { label: string; value: string | null | undefined }[] = [
      { label: "Teléfono Fijo", value: patient.phone },
      { label: "Teléfono Móvil", value: patient.phone_mobile },
      { label: "Email", value: patient.email },
      { label: "Dirección", value: patient.address },
      { label: "Ciudad", value: patient.city },
      { label: "Distrito", value: patient.district },
      { label: "Referencia", value: patient.address_reference },
    ];

    const emergencyFields: { label: string; value: string | null | undefined }[] = [
      { label: "Nombre", value: patient.emergency_contact_name },
      { label: "Parentesco", value: patient.emergency_contact_relationship },
      { label: "Teléfono", value: patient.emergency_contact_phone },
    ];

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Contacto</h3>
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Section 1: Contact Info */}
        <div className="mb-6">
          <p className="text-[0.8125rem] font-semibold text-foreground mb-4">
            Información de Contacto
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {contactFields.map((f) => (
              <div key={f.label}>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  {f.label}
                </p>
                <p className="text-[0.875rem] text-foreground">{f.value || "-"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border my-6" />

        {/* Section 2: Emergency Contact */}
        <div>
          <p className="text-[0.8125rem] font-semibold text-foreground mb-4">
            Contacto de Emergencia
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {emergencyFields.map((f) => (
              <div key={f.label}>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  {f.label}
                </p>
                <p className="text-[0.875rem] text-foreground">{f.value || "-"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- EDIT MODE ----
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Contacto</h3>
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

      {/* Section 1: Contact Info */}
      <div className="mb-6">
        <p className="text-[0.8125rem] font-semibold text-foreground mb-4">
          Información de Contacto
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Teléfono Fijo */}
          <div>
            <label className={labelClass}>Teléfono Fijo</label>
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {/* Teléfono Móvil */}
          <div>
            <label className={labelClass}>Teléfono Móvil</label>
            <input
              type="tel"
              className={inputClass}
              value={form.phone_mobile}
              onChange={(e) => set("phone_mobile", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              className={inputClass}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          {/* Ciudad */}
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              type="text"
              className={inputClass}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>

          {/* Distrito */}
          <div>
            <label className={labelClass}>Distrito</label>
            <input
              type="text"
              className={inputClass}
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
            />
          </div>

          {/* Referencia */}
          <div>
            <label className={labelClass}>Referencia</label>
            <input
              type="text"
              className={inputClass}
              value={form.address_reference}
              onChange={(e) => set("address_reference", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border my-6" />

      {/* Section 2: Emergency Contact */}
      <div>
        <p className="text-[0.8125rem] font-semibold text-foreground mb-4">
          Contacto de Emergencia
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Nombre */}
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              type="text"
              className={inputClass}
              value={form.emergency_contact_name}
              onChange={(e) => set("emergency_contact_name", e.target.value)}
            />
          </div>

          {/* Parentesco */}
          <div>
            <label className={labelClass}>Parentesco</label>
            <select
              className={inputClass}
              value={form.emergency_contact_relationship}
              onChange={(e) => set("emergency_contact_relationship", e.target.value)}
            >
              <option value="">Seleccionar</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Teléfono */}
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="tel"
              className={inputClass}
              value={form.emergency_contact_phone}
              onChange={(e) => set("emergency_contact_phone", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
