import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { PatientWithStats } from "../lib/types";

export function usePatients() {
  const { clinic } = useAuth();
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("patients_with_stats")
      .select("*")
      .eq("clinic_id", clinic.id)
      .order("full_name");

    if (error) {
      console.error("Error fetching patients:", error.message);
    } else if (data) {
      setPatients(data as unknown as PatientWithStats[]);
    }
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, loading, refetch: fetchPatients };
}

export function usePatient(id: string | undefined) {
  const { clinic } = useAuth();
  const [patient, setPatient] = useState<PatientWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPatient = useCallback(async () => {
    if (!id || !clinic) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("patients_with_stats")
      .select("*")
      .eq("id", id)
      .eq("clinic_id", clinic.id)
      .single();

    if (error) {
      console.error("Error fetching patient:", error.message);
    } else if (data) {
      setPatient(data as unknown as PatientWithStats);
    }
    setLoading(false);
  }, [id, clinic]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return { patient, loading, refetch: fetchPatient };
}

export function usePatientMutations() {
  const { clinic } = useAuth();

  async function createPatient(data: {
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
    birthdate?: string;
    blood_type?: string;
    allergies?: string[];
  }) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase.from("patients").insert({
      clinic_id: clinic.id,
      full_name: data.full_name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      birthdate: data.birthdate || null,
      blood_type: data.blood_type || null,
      allergies: data.allergies || [],
      status: "active",
    } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  async function updatePatient(id: string, updates: Record<string, unknown>) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("patients")
      .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  async function deletePatient(id: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("patients")
      .update({ status: "inactive", updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  return { createPatient, updatePatient, deletePatient };
}
