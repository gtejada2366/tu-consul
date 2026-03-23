import { Clock, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useState } from "react";
import type { OdontogramWithConditions } from "../../../lib/types";

interface OdontogramHistoryProps {
  records: OdontogramWithConditions[];
  activeRecordId: string | null;
  onSelectRecord: (recordId: string) => void;
}

export function OdontogramHistory({ records, activeRecordId, onSelectRecord }: OdontogramHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (records.length === 0) return null;

  const shown = expanded ? records : records.slice(0, 3);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[0.8125rem] font-medium text-foreground-secondary hover:text-foreground transition-colors mb-2"
      >
        <Clock className="w-4 h-4" />
        Historial ({records.length} registros)
        {records.length > 3 && (expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
      </button>

      <div className="space-y-1.5">
        {shown.map((record) => {
          const isActive = record.id === activeRecordId;
          const condCount = record.tooth_conditions?.length || 0;
          const date = record.date.split("-").reverse().join("/");

          return (
            <button
              key={record.id}
              onClick={() => onSelectRecord(record.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : "border border-border hover:bg-surface-alt"
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive && <Eye className="w-3.5 h-3.5 text-primary" />}
                <div>
                  <p className={`text-[0.8125rem] font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                    {date}
                  </p>
                  <p className="text-[0.6875rem] text-foreground-secondary">
                    {record.doctor?.full_name || "Doctor"} &middot; {condCount} condiciones
                  </p>
                </div>
              </div>
              {record.notes && (
                <p className="text-[0.6875rem] text-foreground-secondary max-w-[150px] truncate">
                  {record.notes}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
