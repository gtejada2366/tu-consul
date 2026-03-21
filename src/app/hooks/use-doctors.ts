import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { User, AppointmentWithRelations } from "../lib/types";
import { toLocalDateStr } from "../lib/constants";

export interface DoctorWithStats extends User {
  appointments_today: number;
  appointments_week: number;
  patients_total: number;
  next_appointment: { date: string; start_time: string; patient_name: string } | null;
}

export function useDoctors() {
  const { clinic } = useAuth();
  const [doctors, setDoctors] = useState<DoctorWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);

    // Get doctors (and admins who also see patients)
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .eq("clinic_id", clinic.id)
      .in("role", ["doctor", "admin"])
      .order("full_name");

    if (!users) { setLoading(false); return; }

    const today = toLocalDateStr(new Date());
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = toLocalDateStr(monday);
    const weekEnd = toLocalDateStr(sunday);

    // Fetch all 3 appointment queries in parallel
    const [weekAptsResult, upcomingAptsResult, allAptsResult] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, doctor_id, date, start_time, patient_id, status, patient:patients(full_name)")
        .eq("clinic_id", clinic.id)
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .neq("status", "cancelled")
        .order("date")
        .order("start_time"),
      supabase
        .from("appointments")
        .select("doctor_id, date, start_time, patient:patients(full_name)")
        .eq("clinic_id", clinic.id)
        .gte("date", today)
        .neq("status", "cancelled")
        .neq("status", "completed")
        .order("date")
        .order("start_time"),
      supabase
        .from("appointments")
        .select("doctor_id, patient_id")
        .eq("clinic_id", clinic.id)
        .neq("status", "cancelled"),
    ]);

    if (weekAptsResult.error) console.error("Error fetching week appointments:", weekAptsResult.error.message);
    if (upcomingAptsResult.error) console.error("Error fetching upcoming appointments:", upcomingAptsResult.error.message);
    if (allAptsResult.error) console.error("Error fetching all appointments:", allAptsResult.error.message);

    const weekApts = weekAptsResult.data;
    const upcomingApts = upcomingAptsResult.data;
    const allApts = allAptsResult.data;

    const doctorsWithStats: DoctorWithStats[] = (users as unknown as User[]).map(doc => {
      const docWeekApts = (weekApts || []).filter(a => (a as Record<string, unknown>).doctor_id === doc.id);
      const todayApts = docWeekApts.filter(a => (a as Record<string, unknown>).date === today);

      // Unique patients
      const docAllApts = (allApts || []).filter(a => (a as Record<string, unknown>).doctor_id === doc.id);
      const uniquePatients = new Set(docAllApts.map(a => (a as Record<string, unknown>).patient_id as string));

      // Next upcoming appointment
      const nextApt = (upcomingApts || []).find(a => {
        const apt = a as Record<string, unknown>;
        if (apt.doctor_id !== doc.id) return false;
        if (apt.date === today) {
          const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          return (apt.start_time as string) >= nowTime;
        }
        return true;
      });

      return {
        ...doc,
        appointments_today: todayApts.length,
        appointments_week: docWeekApts.length,
        patients_total: uniquePatients.size,
        next_appointment: nextApt ? {
          date: (nextApt as Record<string, unknown>).date as string,
          start_time: (nextApt as Record<string, unknown>).start_time as string,
          patient_name: ((nextApt as Record<string, unknown>).patient as Record<string, unknown>)?.full_name as string || "-",
        } : null,
      };
    });

    setDoctors(doctorsWithStats);
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, refetch: fetchDoctors };
}

export function useDoctorAppointments(doctorId: string | undefined, date: string) {
  const { clinic } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!clinic || !doctorId) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("appointments")
      .select("*, patient:patients(full_name), doctor:users(full_name)")
      .eq("clinic_id", clinic.id)
      .eq("doctor_id", doctorId)
      .eq("date", date)
      .order("start_time");

    if (data) setAppointments(data as unknown as AppointmentWithRelations[]);
    setLoading(false);
  }, [clinic, doctorId, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refetch: fetchAppointments };
}

export function useDoctorWeekAppointments(doctorId: string | undefined, startDate: string, endDate: string) {
  const { clinic } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!clinic || !doctorId) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("appointments")
      .select("*, patient:patients(full_name), doctor:users(full_name)")
      .eq("clinic_id", clinic.id)
      .eq("doctor_id", doctorId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date")
      .order("start_time");

    if (data) setAppointments(data as unknown as AppointmentWithRelations[]);
    setLoading(false);
  }, [clinic, doctorId, startDate, endDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refetch: fetchAppointments };
}
