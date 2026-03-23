import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Save, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Loading } from "../../../components/ui/loading";
import { OdontogramChart } from "../odontogram/odontogram-chart";
import { ToothDetailPanel } from "../odontogram/tooth-detail-panel";
import { OdontogramLegend } from "../odontogram/odontogram-legend";
import { OdontogramHistory } from "../odontogram/odontogram-history";
import { useOdontogram, useOdontogramMutations, buildConditionsMap } from "../../../hooks/use-odontogram";
import type { PatientWithStats, ToothCondition, ToothConditionType, ToothSurface } from "../../../lib/types";

interface OdontogramTabProps {
  patient: PatientWithStats;
}

export function OdontogramTab({ patient }: OdontogramTabProps) {
  const { records, loading, refetch } = useOdontogram(patient.id);
  const { createRecord } = useOdontogramMutations();

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [pendingConditions, setPendingConditions] = useState<ToothCondition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resolve the active record
  const activeRecord = useMemo(() => {
    if (!records.length) return null;
    if (activeRecordId) return records.find(r => r.id === activeRecordId) || records[0];
    return records[0];
  }, [records, activeRecordId]);

  // Build the conditions map — from pending edits or active record
  const conditionsMap = useMemo(() => {
    if (isEditing) return buildConditionsMap(pendingConditions);
    if (activeRecord) return buildConditionsMap(activeRecord.tooth_conditions || []);
    return {};
  }, [isEditing, pendingConditions, activeRecord]);

  // Conditions for the selected tooth
  const toothConditions = selectedTooth ? (conditionsMap[selectedTooth] || []) : [];

  // Is viewing a historical (non-latest) record?
  const isViewingHistory = activeRecord && records.length > 0 && activeRecord.id !== records[0].id;

  function handleNewRecord() {
    // Start editing with current conditions as base
    const base = activeRecord?.tooth_conditions || [];
    setPendingConditions(base.map((c, i) => ({ ...c, id: `pending-${i}` })));
    setIsEditing(true);
    setSelectedTooth(null);
  }

  function handleAddCondition(surface: ToothSurface, condition: ToothConditionType, notes?: string) {
    if (!selectedTooth || !isEditing) return;
    const newCond: ToothCondition = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      odontogram_record_id: "",
      tooth_number: selectedTooth,
      surface,
      condition,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    setPendingConditions(prev => [...prev, newCond]);
  }

  function handleRemoveCondition(conditionId: string) {
    if (!isEditing) return;
    setPendingConditions(prev => prev.filter(c => c.id !== conditionId));
  }

  async function handleSave() {
    setSaving(true);
    const result = await createRecord({
      patient_id: patient.id,
      conditions: pendingConditions.map(c => ({
        tooth_number: c.tooth_number,
        surface: c.surface,
        condition: c.condition,
        notes: c.notes || undefined,
      })),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Odontograma guardado");
      setIsEditing(false);
      setPendingConditions([]);
      setSelectedTooth(null);
      setActiveRecordId(null);
      await refetch();
    }
    setSaving(false);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setPendingConditions([]);
    setSelectedTooth(null);
  }

  function handleSelectRecord(recordId: string) {
    if (isEditing) return; // Don't switch while editing
    setActiveRecordId(recordId);
    setSelectedTooth(null);
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-foreground">Odontograma</h3>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={handleNewRecord}>
              <Plus className="w-4 h-4 mr-1" />
              {records.length === 0 ? "Crear Odontograma" : "Nuevo Registro"}
            </Button>
          )}
        </div>
      </div>

      {/* Editing banner */}
      {isEditing && (
        <div className="bg-primary/5 border border-primary/20 rounded-[8px] px-3 py-2 text-[0.8125rem] text-primary">
          Modo edición — haz clic en un diente para agregar condiciones. Guarda cuando termines.
        </div>
      )}

      {/* Historical view banner */}
      {isViewingHistory && !isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2 text-[0.8125rem] text-amber-700">
          Viendo registro histórico del {activeRecord?.date.split("-").reverse().join("/")}
        </div>
      )}

      {/* No records yet */}
      {!isEditing && records.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8 2 6 5 6 8c0 2 1 3 1 5h10c0-2 1-3 1-5 0-3-2-6-6-6z" />
              <rect x="8" y="14" width="8" height="4" rx="1" />
              <line x1="10" y1="18" x2="10" y2="20" />
              <line x1="14" y1="18" x2="14" y2="20" />
            </svg>
          </div>
          <p className="text-[0.875rem] text-foreground-secondary mb-1">No hay odontograma registrado</p>
          <p className="text-[0.75rem] text-foreground-secondary">Crea el primer registro para este paciente</p>
        </div>
      )}

      {/* Chart + Detail panel */}
      {(isEditing || records.length > 0) && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chart */}
          <div className="flex-1 min-w-0">
            <OdontogramChart
              conditionsMap={conditionsMap}
              selectedTooth={selectedTooth}
              onSelectTooth={setSelectedTooth}
            />
            <OdontogramLegend />
          </div>

          {/* Detail panel */}
          {selectedTooth && (
            <div className="lg:w-[320px] flex-shrink-0">
              <ToothDetailPanel
                toothNumber={selectedTooth}
                conditions={toothConditions}
                onAddCondition={handleAddCondition}
                onRemoveCondition={handleRemoveCondition}
                onClose={() => setSelectedTooth(null)}
                readOnly={!isEditing}
              />
            </div>
          )}
        </div>
      )}

      {/* History */}
      {records.length > 0 && (
        <OdontogramHistory
          records={records}
          activeRecordId={activeRecord?.id || null}
          onSelectRecord={handleSelectRecord}
        />
      )}
    </div>
  );
}
