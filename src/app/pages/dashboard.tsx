import { Link } from "react-router";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Loading } from "../components/ui/loading";
import {
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Plus
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useDashboard } from "../hooks/use-dashboard";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/constants";

export function Dashboard() {
  const { stats, todayAppointments, weeklyData, loading, canSeeRevenue } = useDashboard();

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const kpiData = [
    {
      title: "Citas Hoy",
      value: String(stats.appointments_today),
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Ocupación",
      value: `${stats.occupancy_pct}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Pacientes Atendidos",
      value: String(stats.patients_attended),
      icon: Users,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    ...(canSeeRevenue ? [{
      title: "Ingresos del Día",
      value: `$${stats.revenue_today.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }] : []),
  ];

  const chartData = weeklyData.map(d => ({ day: d.day, citas: d.appointments }));

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1 capitalize">
            {today}
          </p>
        </div>
        <Link to="/agenda">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${canSeeRevenue ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
        {kpiData.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-150">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-1">
                    {kpi.title}
                  </p>
                  <p className="text-[1.75rem] font-semibold text-foreground leading-tight">
                    {kpi.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-[10px] ${kpi.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Próximas Citas</CardTitle>
              <Link to="/agenda">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-[10px] border border-border
                      hover:bg-surface-alt transition-colors duration-150"
                  >
                    <div className="flex items-center justify-center w-16 h-16 rounded-[10px] bg-primary/10">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-[0.875rem]">
                          {appointment.patient?.full_name || "-"}
                        </p>
                        <Badge variant={STATUS_COLORS[appointment.status] || "default"}>
                          {STATUS_LABELS[appointment.status] || appointment.status}
                        </Badge>
                      </div>
                      <p className="text-[0.75rem] text-foreground-secondary">
                        {new Date(appointment.date + "T00:00").toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {appointment.start_time?.slice(0, 5)} • {appointment.type}
                      </p>
                    </div>
                    <Link to="/agenda">
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                <p className="text-[0.875rem] text-foreground-secondary">
                  No hay citas para hoy
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link to="/agenda">
                  <Button variant="tertiary" className="w-full justify-start" size="md">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Agenda
                  </Button>
                </Link>
                <Link to="/pacientes">
                  <Button variant="tertiary" className="w-full justify-start" size="md">
                    <Users className="w-4 h-4 mr-2" />
                    Buscar Paciente
                  </Button>
                </Link>
                <Link to="/facturacion">
                  <Button variant="tertiary" className="w-full justify-start" size="md">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Registrar Cobro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Overview */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Citas de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tick={{ fill: '#475569', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <Bar dataKey="citas" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
