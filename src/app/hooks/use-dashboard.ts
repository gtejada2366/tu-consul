import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { AppointmentWithRelations } from "../lib/types";

interface DashboardComputedStats {
  appointments_today: number;
  occupancy_pct: number;
  patients_attended: number;
  revenue_today: number;
}

interface WeeklyData {
  day: string;
  appointments: number;
}

export function useDashboard() {
  const { clinic, user } = useAuth();
  const [stats, setStats] = useState<DashboardComputedStats>({
    appointments_today: 0,
    occupancy_pct: 0,
    patients_attended: 0,
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

      // Fetch today's appointments (increased limit to 10)
      const { data: todayAppts } = await supabase
        .from("appointments")
        .select("*, patient:patients(full_name), doctor:users(full_name)")
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .neq("status", "cancelled")
        .order("start_time")
        .limit(10);

      if (todayAppts) {
        setTodayAppointments(todayAppts as unknown as AppointmentWithRelations[]);
      }

      // Compute stats locally instead of relying on RPC

      // Total citas hoy (no canceladas)
      const { count: totalTodayCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .neq("status", "cancelled");

      // Pacientes atendidos hoy (completed + in_progress)
      const { count: attendedCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .in("status", ["completed", "in_progress"]);

      // Occupancy: attended + in_progress vs total non-cancelled today
      const totalToday = totalTodayCount || 0;
      const attended = attendedCount || 0;
      const occupancy = totalToday > 0 ? Math.round((attended / totalToday) * 100) : 0;

      // Revenue today
      const { data: invoicesToday } = await supabase
        .from("invoices")
        .select("amount")
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .eq("status", "paid");

      const revenue = invoicesToday ? invoicesToday.reduce((sum, inv) => sum + ((inv as Record<string, unknown>).amount as number || 0), 0) : 0;

      setStats({
        appointments_today: totalToday,
        occupancy_pct: occupancy,
        patients_attended: attended,
        revenue_today: revenue,
      });

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

  const canSeeRevenue = user?.role === "admin";

  return { stats, todayAppointments, weeklyData, loading, canSeeRevenue };
}
