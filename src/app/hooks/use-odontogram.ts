import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import { toLocalDateStr } from "../lib/constants";
import type { OdontogramWithConditions, ToothCondition, ToothConditionsMap, ToothConditionType, ToothSurface } from "../lib/types";

export function buildConditionsMap(conditions: ToothCondition[]): ToothConditionsMap {
  const map: ToothConditionsMap = {};
  for (const c of conditions) {
    if (!map[c.tooth_number]) map[c.tooth_number] = [];
    map[c.tooth_number].push(c);
  }
  return map;
}

export function useOdontogram(patientId: string | undefined) {
  const { clinic } = useAuth();
  const [records, setRecords] = useState<OdontogramWithConditions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!patientId || !clinic) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("odontogram_records")
      .select("*, tooth_conditions(*), doctor:users(full_name)")
      .eq("patient_id", patientId)
      .eq("clinic_id", clinic.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setRecords(data as unknown as OdontogramWithConditions[]);
    }
    setLoading(false);
  }, [patientId, clinic]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, refetch: fetchRecords };
}

export function useOdontogramMutations() {
  const { clinic, user } = useAuth();

  async function createRecord(data: {
    patient_id: string;
    notes?: string;
    conditions: { tooth_number: number; surface: ToothSurface; condition: ToothConditionType; notes?: string }[];
  }) {
    if (!clinic || !user) return { error: "No hay sesión activa" };

    const { data: record, error } = await supabase
      .from("odontogram_records")
      .insert({
        clinic_id: clinic.id,
        patient_id: data.patient_id,
        doctor_id: user.id,
        date: toLocalDateStr(new Date()),
        notes: data.notes || null,
      } as Record<string, unknown>)
      .select()
      .single();

    if (error) return { error: error.message };

    const recordId = (record as Record<string, unknown>)?.id as string;

    if (data.conditions.length > 0 && recordId) {
      const { error: condError } = await supabase
        .from("tooth_conditions")
        .insert(
          data.conditions.map((c) => ({
            odontogram_record_id: recordId,
            tooth_number: c.tooth_number,
            surface: c.surface,
            condition: c.condition,
            notes: c.notes || null,
          })) as Record<string, unknown>[]
        );
      if (condError) return { error: "Registro creado pero error en condiciones: " + condError.message };
    }

    return { error: null, recordId };
  }

  async function addCondition(recordId: string, data: {
    tooth_number: number;
    surface: ToothSurface;
    condition: ToothConditionType;
    notes?: string;
  }) {
    if (!clinic) return { error: "No hay sesión activa" };

    const { error } = await supabase
      .from("tooth_conditions")
      .insert({
        odontogram_record_id: recordId,
        tooth_number: data.tooth_number,
        surface: data.surface,
        condition: data.condition,
        notes: data.notes || null,
      } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  async function removeCondition(conditionId: string) {
    const { error } = await supabase
      .from("tooth_conditions")
      .delete()
      .eq("id", conditionId);

    return { error: error?.message || null };
  }

  return { createRecord, addCondition, removeCondition };
}
