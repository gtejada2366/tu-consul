import React from "react";
import {
  TEETH_UPPER_RIGHT,
  TEETH_UPPER_LEFT,
  TEETH_LOWER_LEFT,
  TEETH_LOWER_RIGHT,
  ANTERIOR_TEETH,
} from "../lib/constants";

interface MiniOdontogramProps {
  selectedTeeth: number[];
  onToggle: (tooth: number) => void;
}

function MiniTooth({ num, selected, isUpper, onClick }: {
  num: number; selected: boolean; isUpper: boolean; onClick: () => void;
}) {
  const isAnterior = ANTERIOR_TEETH.includes(num);
  const rootH = isAnterior ? 10 : 8;
  const crownSize = 22;
  const totalH = crownSize + rootH + 11;
  const crownY = isUpper ? 9 : rootH + 1;
  const rootY = isUpper ? crownY + crownSize : 0;
  const numberY = isUpper ? 7 : crownY + crownSize + 8;

  return (
    <svg
      width="26" height={totalH} viewBox={`-2 0 26 ${totalH}`}
      className="cursor-pointer"
      onClick={onClick}
    >
      <text x="11" y={numberY} textAnchor="middle" fontSize="7" fontWeight="600"
        fill={selected ? "#2563EB" : "#9CA3AF"}>
        {num}
      </text>
      <g transform={`translate(0, ${rootY})`}>
        {isAnterior ? (
          <path
            d={isUpper ? `M 9,0 L 11,${rootH} L 13,0` : `M 9,${rootH} L 11,0 L 13,${rootH}`}
            fill="none" stroke="#D1D5DB" strokeWidth="1"
          />
        ) : (
          <g>
            <path d={isUpper ? `M 6,0 L 7,${rootH - 1}` : `M 6,${rootH} L 7,1`} fill="none" stroke="#D1D5DB" strokeWidth="1" />
            <path d={isUpper ? `M 16,0 L 15,${rootH - 1}` : `M 16,${rootH} L 15,1`} fill="none" stroke="#D1D5DB" strokeWidth="1" />
          </g>
        )}
      </g>
      <g transform={`translate(0, ${crownY})`}>
        <rect x="0" y="0" width={crownSize} height={crownSize} rx="3"
          fill={selected ? "#2563EB" : "#FFFFFF"}
          stroke={selected ? "#2563EB" : "#CBD5E1"}
          strokeWidth={selected ? "2" : "1"}
        />
        {selected && (
          <polyline points="6,11 10,15 16,8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </svg>
  );
}

export const MiniOdontogram = React.memo(function MiniOdontogram({ selectedTeeth, onToggle }: MiniOdontogramProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-center gap-0">
        {TEETH_UPPER_RIGHT.map(n => (
          <MiniTooth key={n} num={n} selected={selectedTeeth.includes(n)} isUpper onClick={() => onToggle(n)} />
        ))}
        <div className="w-px bg-border mx-0.5" />
        {TEETH_UPPER_LEFT.map(n => (
          <MiniTooth key={n} num={n} selected={selectedTeeth.includes(n)} isUpper onClick={() => onToggle(n)} />
        ))}
      </div>
      <div className="h-px bg-border" />
      <div className="flex justify-center gap-0">
        {TEETH_LOWER_LEFT.map(n => (
          <MiniTooth key={n} num={n} selected={selectedTeeth.includes(n)} isUpper={false} onClick={() => onToggle(n)} />
        ))}
        <div className="w-px bg-border mx-0.5" />
        {TEETH_LOWER_RIGHT.map(n => (
          <MiniTooth key={n} num={n} selected={selectedTeeth.includes(n)} isUpper={false} onClick={() => onToggle(n)} />
        ))}
      </div>
    </div>
  );
});
