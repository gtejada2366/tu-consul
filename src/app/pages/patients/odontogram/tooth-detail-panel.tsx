import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { CONDITION_CONFIG, SURFACE_LABELS, TOOTH_NAMES } from "../../../lib/constants";
import type { ToothCondition, ToothConditionType, ToothSurface } from "../../../lib/types";

interface ToothDetailPanelProps {
  toothNumber: number;
  conditions: ToothCondition[];
  onAddCondition: (surface: ToothSurface, condition: ToothConditionType, notes?: string) => void;
  onRemoveCondition: (conditionId: string) => void;
  onClose: () => void;
  readOnly?: boolean;
}

const SURFACES: ToothSurface[] = ["oclusal", "mesial", "distal", "vestibular", "lingual", "whole"];
const CONDITIONS: ToothConditionType[] = [
  "caries", "obturacion", "sellante", "extraccion", "ausente",
  "corona", "endodoncia", "fractura", "implante", "protesis",
];

export function ToothDetailPanel({
  toothNumber, conditions, onAddCondition, onRemoveCondition, onClose, readOnly,
}: ToothDetailPanelProps) {
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface>("oclusal");
  const [notes, setNotes] = useState("");

  const toothName = TOOTH_NAMES[toothNumber] || `Diente ${toothNumber}`;

  function handleAdd(condition: ToothConditionType) {
    onAddCondition(selectedSurface, condition, notes || undefined);
    setNotes("");
  }

  return (
    <div className="bg-surface border border-border rounded-[12px] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.9375rem] font-semibold text-foreground">
            Diente {toothNumber}
          </h3>
          <p className="text-[0.75rem] text-foreground-secondary">{toothName}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-alt transition-colors">
          <X className="w-4 h-4 text-foreground-secondary" />
        </button>
      </div>

      {/* Current conditions */}
      {conditions.length > 0 && (
        <div>
          <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Condiciones actuales</p>
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((c) => {
              const cfg = CONDITION_CONFIG[c.condition];
              return (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.6875rem] font-medium border"
                  style={{
                    backgroundColor: cfg.color + "15",
                    borderColor: cfg.color + "40",
                    color: cfg.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {cfg.label}
                  {c.surface !== "whole" && (
                    <span className="opacity-70">({SURFACE_LABELS[c.surface]})</span>
                  )}
                  {!readOnly && (
                    <button
                      onClick={() => onRemoveCondition(c.id)}
                      className="ml-0.5 hover:opacity-80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {conditions.length === 0 && (
        <p className="text-[0.8125rem] text-foreground-secondary text-center py-2">
          Sin condiciones registradas
        </p>
      )}

      {/* Add condition — only in edit mode */}
      {!readOnly && (
        <>
          {/* Surface selector */}
          <div>
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Superficie</p>
            <div className="flex flex-wrap gap-1">
              {SURFACES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSurface(s)}
                  className={`px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium border transition-colors ${
                    selectedSurface === s
                      ? "bg-primary text-white border-primary"
                      : "bg-surface border-border text-foreground-secondary hover:bg-surface-alt"
                  }`}
                >
                  {SURFACE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Condition grid */}
          <div>
            <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Agregar condición</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CONDITIONS.map((cond) => {
                const cfg = CONDITION_CONFIG[cond];
                return (
                  <button
                    key={cond}
                    onClick={() => handleAdd(cond)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border text-[0.75rem] font-medium text-foreground hover:bg-surface-alt transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionales..."
              rows={2}
              className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[0.8125rem] text-foreground placeholder:text-foreground-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
