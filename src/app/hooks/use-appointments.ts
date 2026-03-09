import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { AppointmentWithRelations } from "../lib/types";

export function useAppointments(date: string) {
  const { clinic } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("appointments")
      .select("*, patient:patients(full_name), doctor:users(full_name)")
      .eq("clinic_id", clinic.id)
      .eq("date", date)
      .order("start_time");

    if (!error && data) {
      setAppointments(data as unknown as AppointmentWithRelations[]);
    }
    setLoading(false);
  }, [clinic, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refetch: fetchAppointments };
}

export function usePatientAppointments(patientId: string | undefined) {
  const { clinic } = useAuth();
  const [upcoming, setUpcoming] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !clinic) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("appointments")
        .select("*, patient:patients(full_name), doctor:users(full_name)")
        .eq("patient_id", patientId!)
        .eq("clinic_id", clinic!.id)
        .gte("date", today)
        .neq("status", "cancelled")
        .order("date")
        .order("start_time");

      if (data) {
        setUpcoming(data as unknown as AppointmentWithRelations[]);
      }
      setLoading(false);
    }

    fetch();
  }, [patientId, clinic]);

  return { upcoming, loading };
}

export function useAppointmentMutations() {
  const { clinic, user } = useAuth();

  async function createAppointment(data: {
    patient_id: string;
    doctor_id?: string;
    date: string;
    start_time: string;
    duration_minutes?: number;
    type: string;
    notes?: string;
  }) {
    if (!clinic || !user) return { error: "No hay sesión activa" };

    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinic.id,
      patient_id: data.patient_id,
      doctor_id: data.doctor_id || user.id,
      date: data.date,
      start_time: data.start_time,
      duration_minutes: data.duration_minutes || 30,
      type: data.type,
      status: "confirmed",
      notes: data.notes || null,
    } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  async function updateAppointment(id: string, updates: Record<string, unknown>) {
    if (!clinic) return { error: "No hay sesión activa" };
    const { error } = await supabase
      .from("appointments")
      .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  async function cancelAppointment(id: string) {
    return updateAppointment(id, { status: "cancelled" });
  }

  return { createAppointment, updateAppointment, cancelAppointment };
}
