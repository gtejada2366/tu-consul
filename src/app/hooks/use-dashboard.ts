import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { AppointmentWithRelations, DashboardStats } from "../lib/types";

interface WeeklyData {
  day: string;
  appointments: number;
}

export function useDashboard() {
  const { clinic } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    appointments_today: 0,
    occupancy_pct: 0,
    new_patients_month: 0,
    revenue_today: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithRelations[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinic) return;

    async function fetchDashboard() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // Fetch today's appointments
      const { data: todayAppts } = await supabase
        .from("appointments")
        .select("*, patient:patients(full_name), doctor:users(full_name)")
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .order("start_time")
        .limit(5);

      if (todayAppts) {
        setTodayAppointments(todayAppts as unknown as AppointmentWithRelations[]);
      }

      // Fetch stats via RPC
      try {
        const { data: statsData } = await supabase.rpc("get_dashboard_stats", {
          p_clinic_id: clinic!.id,
        } as Record<string, unknown>);

        if (statsData) {
          setStats(statsData as unknown as DashboardStats);
        }
      } catch {
        // RPC may not be available yet, use defaults
      }

      // Fetch weekly data for chart
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
      const weekly: WeeklyData[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];

        const { count } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinic!.id)
          .eq("date", dateStr)
          .neq("status", "cancelled");

        weekly.push({ day: weekDays[i], appointments: count || 0 });
      }

      setWeeklyData(weekly);
      setLoading(false);
    }

    fetchDashboard();
  }, [clinic]);

  return { stats, todayAppointments, weeklyData, loading };
}
