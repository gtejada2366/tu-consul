import { CONDITION_CONFIG } from "../../../lib/constants";
import type { ToothConditionType } from "../../../lib/types";

const ORDERED: ToothConditionType[] = [
  "caries", "obturacion", "sellante", "extraccion", "ausente",
  "corona", "endodoncia", "fractura", "implante", "protesis",
];

export function OdontogramLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-2">
      {ORDERED.map((cond) => {
        const cfg = CONDITION_CONFIG[cond];
        return (
          <div key={cond} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: cfg.color }}
            />
            <span className="text-[0.6875rem] text-foreground-secondary">
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
