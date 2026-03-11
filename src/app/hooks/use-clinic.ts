import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseNoSession } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { User, ClinicSchedule, NotificationPreferences } from "../lib/types";

export function useClinicUsers() {
  const { clinic } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("clinic_id", clinic.id)
      .order("full_name");

    if (data) setUsers(data as unknown as User[]);
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, refetch: fetchUsers };
}

export function useClinicSchedules() {
  const { clinic } = useAuth();
  const [schedules, setSchedules] = useState<ClinicSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinic) return;

    async function fetch() {
      const { data } = await supabase
        .from("clinic_schedules")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .order("day_of_week");

      if (data) setSchedules(data as unknown as ClinicSchedule[]);
      setLoading(false);
    }

    fetch();
  }, [clinic]);

  async function saveSchedules(updated: ClinicSchedule[]) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase
      .from("clinic_schedules")
      .upsert(
        updated.map((s) => ({ ...s, clinic_id: clinic.id })) as Record<string, unknown>[]
      );

    return { error: error?.message || null };
  }

  return { schedules, loading, saveSchedules };
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (data) setPrefs(data as unknown as NotificationPreferences);
      setLoading(false);
    }

    fetch();
  }, [user]);

  async function updatePrefs(updated: Partial<NotificationPreferences>) {
    if (!user) return { error: "No hay usuario activo" };

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...updated } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  return { prefs, loading, updatePrefs };
}

export function useClinicMutations() {
  const { clinic } = useAuth();

  async function updateClinic(data: { name?: string; email?: string; phone?: string; address?: string }) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase
      .from("clinics")
      .update({ ...data, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", clinic.id);

    return { error: error?.message || null };
  }

  return { updateClinic };
}

export function useUserMutations() {
  const { clinic } = useAuth();

  async function createUser(data: {
    full_name: string;
    email: string;
    password: string;
    role: "admin" | "doctor" | "receptionist";
    specialty?: string;
  }) {
    if (!clinic) return { error: "No hay clínica activa" };

    // 1. Create auth user with the non-session client (won't log out admin)
    const { data: authData, error: authError } = await supabaseNoSession.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: "No se pudo crear el usuario" };

    // 2. Insert into users table
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
      clinic_id: clinic.id,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      specialty: data.specialty || null,
      is_active: true,
    } as Record<string, unknown>);

    if (dbError) return { error: dbError.message };
    return { error: null };
  }

  async function updateUserRole(userId: string, role: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("users")
      .update({ role, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", userId)
      .eq("clinic_id", clinic.id);
    return { error: error?.message || null };
  }

  async function toggleUserActive(userId: string, isActive: boolean) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("users")
      .update({ is_active: isActive, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", userId)
      .eq("clinic_id", clinic.id);
    return { error: error?.message || null };
  }

  return { createUser, updateUserRole, toggleUserActive };
}
