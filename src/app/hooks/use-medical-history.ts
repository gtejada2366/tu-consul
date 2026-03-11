import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { ConsultationWithRelations } from "../lib/types";
import { toLocalDateStr } from "../lib/constants";

export function useMedicalHistory(patientId: string | undefined) {
  const { clinic } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!patientId || !clinic) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("consultations")
      .select("*, prescriptions(*), lab_results(*)")
      .eq("patient_id", patientId)
      .eq("clinic_id", clinic.id)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (!error && data) {
      setConsultations(data as unknown as ConsultationWithRelations[]);
    }
    setLoading(false);
  }, [patientId, clinic]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { consultations, loading, refetch: fetchHistory };
}

export function useConsultationMutations() {
  const { clinic, user } = useAuth();

  async function createConsultation(data: {
    patient_id: string;
    appointment_id?: string;
    type: "consulta" | "prescription" | "lab";
    title: string;
    description?: string;
    blood_pressure?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    diagnosis?: string;
    prescriptions?: { medication_name: string; dosage: string; duration: string }[];
    lab_results?: { test_name: string; result: string; status: "normal" | "abnormal" }[];
  }) {
    if (!clinic || !user) return { error: "No hay sesión activa" };

    const now = new Date();

    const { data: consultation, error } = await supabase
      .from("consultations")
      .insert({
        clinic_id: clinic.id,
        patient_id: data.patient_id,
        doctor_id: user.id,
        appointment_id: data.appointment_id || null,
        date: toLocalDateStr(now),
        time: now.toTimeString().slice(0, 5),
        type: data.type,
        title: data.title,
        description: data.description || null,
        blood_pressure: data.blood_pressure || null,
        temperature: data.temperature || null,
        weight: data.weight || null,
        height: data.height || null,
        diagnosis: data.diagnosis || null,
      } as Record<string, unknown>)
      .select()
      .single();

    if (error) return { error: error.message };

    const consultationId = (consultation as Record<string, unknown>)?.id;

    if (data.prescriptions?.length && consultationId) {
      const { error: rxError } = await supabase.from("prescriptions").insert(
        data.prescriptions.map((p) => ({
          consultation_id: consultationId,
          medication_name: p.medication_name,
          dosage: p.dosage,
          duration: p.duration,
        })) as Record<string, unknown>[]
      );
      if (rxError) return { error: "Consulta creada pero error en recetas: " + rxError.message };
    }

    if (data.lab_results?.length && consultationId) {
      const { error: labError } = await supabase.from("lab_results").insert(
        data.lab_results.map((r) => ({
          consultation_id: consultationId,
          test_name: r.test_name,
          result: r.result,
          status: r.status,
        })) as Record<string, unknown>[]
      );
      if (labError) return { error: "Consulta creada pero error en laboratorios: " + labError.message };
    }

    return { error: null };
  }

  return { createConsultation };
}
