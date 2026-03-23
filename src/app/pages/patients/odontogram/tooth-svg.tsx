import React from "react";
import type { ToothCondition, ToothConditionType, ToothSurface } from "../../../lib/types";
import { CONDITION_CONFIG, ANTERIOR_TEETH } from "../../../lib/constants";

interface ToothSVGProps {
  toothNumber: number;
  conditions: ToothCondition[];
  isSelected: boolean;
  isUpper: boolean;
  onClick: (toothNumber: number) => void;
}

const SURFACE_PATHS: Record<string, string> = {
  vestibular: "M 0,0 L 40,0 L 30,10 L 10,10 Z",
  mesial:     "M 0,0 L 0,40 L 10,30 L 10,10 Z",
  distal:     "M 40,0 L 40,40 L 30,30 L 30,10 Z",
  oclusal:    "M 10,10 L 30,10 L 30,30 L 10,30 Z",
  lingual:    "M 0,40 L 40,40 L 30,30 L 10,30 Z",
};

function getSurfaceColor(conditions: ToothCondition[], surface: ToothSurface): string | null {
  // Check for whole-tooth conditions first
  const wholeCond = conditions.find(c => c.surface === "whole");
  if (wholeCond) {
    const cfg = CONDITION_CONFIG[wholeCond.condition];
    if (cfg.type === "fill") return cfg.color;
  }
  // Check surface-specific
  const surfaceCond = conditions.find(c => c.surface === surface);
  if (surfaceCond) {
    const cfg = CONDITION_CONFIG[surfaceCond.condition];
    if (cfg.type === "fill") return cfg.color;
  }
  return null;
}

function getWholeSymbol(conditions: ToothCondition[]): ToothConditionType | null {
  const symbolConds: ToothConditionType[] = ["extraccion", "ausente", "corona", "endodoncia", "fractura", "implante", "protesis"];
  for (const c of conditions) {
    if (symbolConds.includes(c.condition)) return c.condition;
  }
  return null;
}

function renderSymbol(condition: ToothConditionType) {
  const cfg = CONDITION_CONFIG[condition];
  switch (condition) {
    case "extraccion":
      return (
        <g stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="4" x2="36" y2="36" />
          <line x1="36" y1="4" x2="4" y2="36" />
        </g>
      );
    case "ausente":
      return (
        <rect x="2" y="2" width="36" height="36" rx="4"
          fill="none" stroke={cfg.color} strokeWidth="2" strokeDasharray="4 3" />
      );
    case "corona":
      return (
        <circle cx="20" cy="20" r="17" fill="none" stroke={cfg.color} strokeWidth="2.5" />
      );
    case "endodoncia":
      return (
        <polygon points="20,4 36,36 4,36" fill="none" stroke={cfg.color} strokeWidth="2" />
      );
    case "fractura":
      return (
        <polyline points="4,16 12,12 18,22 26,10 34,20" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinejoin="round" />
      );
    case "implante":
      return (
        <g>
          <line x1="20" y1="6" x2="20" y2="34" stroke={cfg.color} strokeWidth="3" />
          <line x1="12" y1="12" x2="28" y2="12" stroke={cfg.color} strokeWidth="2" />
          <line x1="14" y1="18" x2="26" y2="18" stroke={cfg.color} strokeWidth="2" />
          <line x1="16" y1="24" x2="24" y2="24" stroke={cfg.color} strokeWidth="2" />
        </g>
      );
    case "protesis":
      return (
        <g>
          <rect x="4" y="14" width="32" height="12" rx="3" fill="none" stroke={cfg.color} strokeWidth="2" />
          <line x1="4" y1="20" x2="36" y2="20" stroke={cfg.color} strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}

export const ToothSVG = React.memo(function ToothSVG({
  toothNumber, conditions, isSelected, isUpper, onClick,
}: ToothSVGProps) {
  const isAnterior = ANTERIOR_TEETH.includes(toothNumber);
  const symbol = getWholeSymbol(conditions);
  const isAbsent = symbol === "ausente";
  const hasConditions = conditions.length > 0;

  const rootH = isAnterior ? 18 : 14;
  const totalH = 40 + rootH + 16; // crown + root + number space
  const crownY = isUpper ? 14 : rootH + 2;
  const rootY = isUpper ? crownY + 40 : 0;
  const numberY = isUpper ? 10 : crownY + 40 + 12;

  return (
    <svg
      width="44" height={totalH} viewBox={`-2 0 44 ${totalH}`}
      className="cursor-pointer"
      onClick={() => onClick(toothNumber)}
    >
      {/* Tooth number */}
      <text
        x="20" y={numberY}
        textAnchor="middle" fontSize="9" fontWeight="600"
        fill={isSelected ? "#2563EB" : "#6B7280"}
      >
        {toothNumber}
      </text>

      {/* Root (decorative) */}
      <g transform={`translate(0, ${rootY})`}>
        {isAnterior ? (
          <path
            d={isUpper ? `M 17,0 L 20,${rootH} L 23,0` : `M 17,${rootH} L 20,0 L 23,${rootH}`}
            fill="none" stroke="#D1D5DB" strokeWidth="1.5"
          />
        ) : (
          <g>
            <path
              d={isUpper ? `M 12,0 L 14,${rootH - 2}` : `M 12,${rootH} L 14,2`}
              fill="none" stroke="#D1D5DB" strokeWidth="1.5"
            />
            <path
              d={isUpper ? `M 28,0 L 26,${rootH - 2}` : `M 28,${rootH} L 26,2`}
              fill="none" stroke="#D1D5DB" strokeWidth="1.5"
            />
          </g>
        )}
      </g>

      {/* Crown */}
      <g transform={`translate(0, ${crownY})`}>
        {/* Selection highlight */}
        {isSelected && (
          <rect x="-2" y="-2" width="44" height="44" rx="6"
            fill="#2563EB" fillOpacity="0.08" stroke="#2563EB" strokeWidth="2" />
        )}

        {/* Absent: dashed outline only */}
        {isAbsent ? (
          <rect x="0" y="0" width="40" height="40" rx="4"
            fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4 3" />
        ) : (
          <>
            {/* Surface polygons */}
            {(Object.keys(SURFACE_PATHS) as ToothSurface[]).map((surface) => {
              const color = getSurfaceColor(conditions, surface);
              return (
                <path
                  key={surface}
                  d={SURFACE_PATHS[surface]}
                  fill={color || "#FFFFFF"}
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
              );
            })}

            {/* Whole-tooth symbol overlay */}
            {symbol && renderSymbol(symbol)}
          </>
        )}

        {/* Condition indicator dot */}
        {hasConditions && !isAbsent && (
          <circle cx="20" cy="-4" r="3" fill={CONDITION_CONFIG[conditions[0].condition].color} />
        )}
      </g>
    </svg>
  );
});
