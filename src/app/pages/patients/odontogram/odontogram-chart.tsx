import { ToothSVG } from "./tooth-svg";
import type { ToothCondition, ToothConditionsMap } from "../../../lib/types";
import {
  TEETH_UPPER_RIGHT, TEETH_UPPER_LEFT,
  TEETH_LOWER_LEFT, TEETH_LOWER_RIGHT,
} from "../../../lib/constants";

interface OdontogramChartProps {
  conditionsMap: ToothConditionsMap;
  selectedTooth: number | null;
  onSelectTooth: (tooth: number) => void;
}

function QuadrantRow({
  teeth, conditionsMap, selectedTooth, onSelectTooth, isUpper, label,
}: {
  teeth: number[];
  conditionsMap: ToothConditionsMap;
  selectedTooth: number | null;
  onSelectTooth: (tooth: number) => void;
  isUpper: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[0.625rem] text-foreground-secondary font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-end gap-0.5">
        {teeth.map((tooth) => (
          <ToothSVG
            key={tooth}
            toothNumber={tooth}
            conditions={conditionsMap[tooth] || []}
            isSelected={selectedTooth === tooth}
            isUpper={isUpper}
            onClick={onSelectTooth}
          />
        ))}
      </div>
    </div>
  );
}

export function OdontogramChart({ conditionsMap, selectedTooth, onSelectTooth }: OdontogramChartProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px] flex flex-col items-center gap-2 py-4">
        {/* Upper jaw */}
        <div className="flex items-end gap-4">
          <QuadrantRow
            teeth={TEETH_UPPER_RIGHT}
            conditionsMap={conditionsMap}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
            isUpper={true}
            label="Sup. Der."
          />
          <div className="w-px h-20 bg-border" />
          <QuadrantRow
            teeth={TEETH_UPPER_LEFT}
            conditionsMap={conditionsMap}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
            isUpper={true}
            label="Sup. Izq."
          />
        </div>

        {/* Divider */}
        <div className="w-full max-w-[680px] h-px bg-border" />

        {/* Lower jaw */}
        <div className="flex items-start gap-4">
          <QuadrantRow
            teeth={TEETH_LOWER_LEFT}
            conditionsMap={conditionsMap}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
            isUpper={false}
            label="Inf. Izq."
          />
          <div className="w-px h-20 bg-border" />
          <QuadrantRow
            teeth={TEETH_LOWER_RIGHT}
            conditionsMap={conditionsMap}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
            isUpper={false}
            label="Inf. Der."
          />
        </div>
      </div>
    </div>
  );
}
