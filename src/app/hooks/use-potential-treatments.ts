import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { PotentialTreatment } from "../lib/types";

export function usePotentialTreatments(patientId: string | undefined) {
  const { clinic } = useAuth();
  const [treatments, setTreatments] = useState<PotentialTreatment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTreatments = useCallback(async () => {
    if (!patientId || !clinic) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("potential_treatments")
      .select("*")
      .eq("patient_id", patientId)
      .eq("clinic_id", clinic.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTreatments(data as unknown as PotentialTreatment[]);
    }
    setLoading(false);
  }, [patientId, clinic]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const pending = treatments.filter(t => t.status === "pending");
  const pendingTotal = pending.reduce((sum, t) => sum + t.estimated_amount, 0);

  return { treatments, pending, pendingTotal, loading, refetch: fetchTreatments };
}

export function usePotentialTreatmentMutations() {
  const { clinic } = useAuth();

  async function createTreatment(data: {
    patient_id: string;
    service: string;
    estimated_amount: number;
    notes?: string;
  }) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase.from("potential_treatments").insert({
      clinic_id: clinic.id,
      patient_id: data.patient_id,
      service: data.service,
      estimated_amount: data.estimated_amount,
      notes: data.notes || null,
      status: "pending",
    } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  async function markAsCompleted(id: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("potential_treatments")
      .update({ status: "completed", updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  async function removeTreatment(id: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("potential_treatments")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  return { createTreatment, markAsCompleted, removeTreatment };
}
