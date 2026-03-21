import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { AppointmentWithRelations } from "../lib/types";
import { toLocalDateStr } from "../lib/constants";

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
      const today = toLocalDateStr(new Date());

      // Fetch next 3 upcoming appointments (from today onwards, exclude finished/cancelled)
      const { data: upcomingAppts, error: aptsError } = await supabase
        .from("appointments")
        .select("*, patient:patients(full_name), doctor:users(full_name)")
        .eq("clinic_id", clinic!.id)
        .gte("date", today)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .order("date")
        .order("start_time")
        .limit(3);

      if (!aptsError && upcomingAppts) {
        setTodayAppointments(upcomingAppts as unknown as AppointmentWithRelations[]);
      }

      // Compute stats locally instead of relying on RPC

      // Total citas hoy (no canceladas)
      const { count: totalTodayCount, error: todayError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .neq("status", "cancelled");

      // Pacientes atendidos hoy (completed + in_progress)
      const { count: attendedCount, error: attendedError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .in("status", ["completed", "in_progress"]);

      // Occupancy: attended + in_progress vs total non-cancelled today
      const totalToday = (!todayError && totalTodayCount) || 0;
      const attended = (!attendedError && attendedCount) || 0;
      const occupancy = totalToday > 0 ? Math.round((attended / totalToday) * 100) : 0;

      // Revenue today
      const { data: invoicesToday, error: revenueError } = await supabase
        .from("invoices")
        .select("amount")
        .eq("clinic_id", clinic!.id)
        .eq("date", today)
        .eq("status", "paid");

      const revenue = (!revenueError && invoicesToday) ? invoicesToday.reduce((sum, inv) => sum + ((inv as Record<string, unknown>).amount as number || 0), 0) : 0;

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

      const weeklyPromises = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = toLocalDateStr(d);

        return supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinic!.id)
          .eq("date", dateStr)
          .neq("status", "cancelled")
          .then(({ count, error: weekError }) => ({
            day: weekDays[i],
            appointments: (!weekError && count) || 0,
          }));
      });

      const weekly = await Promise.all(weeklyPromises);

      setWeeklyData(weekly);
      setLoading(false);
    }

    fetchDashboard();
  }, [clinic]);

  const canSeeRevenue = user?.role === "admin";

  return { stats, todayAppointments, weeklyData, loading, canSeeRevenue };
}
