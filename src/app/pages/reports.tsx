import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import { Loading } from "../components/ui/loading";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = [
  "#2563eb",
  "#60a5fa",
  "#1e40af",
  "#93c5fd",
  "#1e3a8a",
  "#bfdbfe",
  "#3b82f6",
  "#dbeafe",
];

const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const MONTH_OPTIONS = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

function formatCurrency(value: number): string {
  return `S/ ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawInvoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  service: string;
  appointment_id: string | null;
}

interface MonthlyData {
  month: string;
  total: number;
}

interface ServiceData {
  name: string;
  value: number;
}

interface DoctorData {
  name: string;
  total: number;
}

// ---------------------------------------------------------------------------
// Custom tooltip for charts
// ---------------------------------------------------------------------------

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-[8px] px-3 py-2 shadow-md">
      <p className="text-[0.75rem] text-foreground-secondary">{label}</p>
      <p className="text-[0.875rem] font-semibold text-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom pie label
// ---------------------------------------------------------------------------

const RADIAN = Math.PI / 180;

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  value,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  name: string;
  value: number;
  percent: number;
}) {
  if (percent < 0.05) return null;
  const radius = outerRadius + 24;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#475569"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
    >
      {name.length > 18 ? name.slice(0, 18) + "..." : name} ({formatCurrency(value)})
    </text>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Reports() {
  const { clinic } = useAuth();

  // Filters
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Data
  const [allInvoices, setAllInvoices] = useState<RawInvoice[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({});
  const [appointmentDoctorMap, setAppointmentDoctorMap] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  // Year options: current year and 2 previous years
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear];
  }, []);

  // -----------------------------------------------------------------------
  // Fetch all data
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!clinic) return;

    async function fetchData() {
      setLoading(true);

      // 1. Fetch all invoices for the clinic
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("id, date, amount, status, service, appointment_id")
        .eq("clinic_id", clinic!.id)
        .order("date", { ascending: false });

      if (invError) {
        console.error("Error fetching invoices:", invError.message);
        setLoading(false);
        return;
      }

      const invoiceData = (invoices || []) as unknown as RawInvoice[];
      setAllInvoices(invoiceData);

      // 2. Build appointment → doctor mapping
      const appointmentIds = invoiceData
        .filter((inv) => inv.appointment_id)
        .map((inv) => inv.appointment_id!);

      const uniqueAppointmentIds = [...new Set(appointmentIds)];

      let apptDoctorMap: Record<string, string> = {};
      if (uniqueAppointmentIds.length > 0) {
        // Supabase IN filter has a limit; batch in chunks of 200
        const chunks: string[][] = [];
        for (let i = 0; i < uniqueAppointmentIds.length; i += 200) {
          chunks.push(uniqueAppointmentIds.slice(i, i + 200));
        }

        for (const chunk of chunks) {
          const { data: appointments, error: apptError } = await supabase
            .from("appointments")
            .select("id, doctor_id")
            .in("id", chunk);

          if (!apptError && appointments) {
            for (const appt of appointments as unknown as Array<{
              id: string;
              doctor_id: string;
            }>) {
              apptDoctorMap[appt.id] = appt.doctor_id;
            }
          }
        }
      }

      setAppointmentDoctorMap(apptDoctorMap);

      // 3. Fetch doctor names
      const doctorIds = [...new Set(Object.values(apptDoctorMap))];
      const docMap: Record<string, string> = {};

      if (doctorIds.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < doctorIds.length; i += 200) {
          chunks.push(doctorIds.slice(i, i + 200));
        }

        for (const chunk of chunks) {
          const { data: doctors, error: docError } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", chunk);

          if (!docError && doctors) {
            for (const doc of doctors as unknown as Array<{
              id: string;
              full_name: string;
            }>) {
              docMap[doc.id] = doc.full_name;
            }
          }
        }
      }

      setDoctorMap(docMap);
      setLoading(false);
    }

    fetchData();
  }, [clinic]);

  // -----------------------------------------------------------------------
  // Computed data
  // -----------------------------------------------------------------------

  const paidInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status === "paid"),
    [allInvoices]
  );

  // KPIs for selected month/year
  const monthlyPaid = useMemo(
    () =>
      paidInvoices.filter((inv) => {
        const d = new Date(inv.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }),
    [paidInvoices, selectedMonth, selectedYear]
  );

  const monthRevenue = useMemo(
    () => monthlyPaid.reduce((sum, inv) => sum + inv.amount, 0),
    [monthlyPaid]
  );

  const avgTicket = useMemo(
    () => (monthlyPaid.length > 0 ? monthRevenue / monthlyPaid.length : 0),
    [monthRevenue, monthlyPaid]
  );

  const yearPaid = useMemo(
    () =>
      paidInvoices
        .filter((inv) => new Date(inv.date).getFullYear() === selectedYear)
        .reduce((sum, inv) => sum + inv.amount, 0),
    [paidInvoices, selectedYear]
  );

  const collectionRate = useMemo(() => {
    const monthInvoices = allInvoices.filter((inv) => {
      const d = new Date(inv.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    if (monthInvoices.length === 0) return 0;
    const paidCount = monthInvoices.filter((i) => i.status === "paid").length;
    return Math.round((paidCount / monthInvoices.length) * 100);
  }, [allInvoices, selectedMonth, selectedYear]);

  // Monthly revenue chart — last 12 months from the selected month/year
  const monthlyChartData = useMemo<MonthlyData[]>(() => {
    const result: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const total = paidInvoices
        .filter((inv) => {
          const invDate = new Date(inv.date);
          return invDate.getMonth() === m && invDate.getFullYear() === y;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);
      result.push({
        month: `${MONTH_NAMES[m]} ${y.toString().slice(2)}`,
        total,
      });
    }
    return result;
  }, [paidInvoices, selectedMonth, selectedYear]);

  // Revenue by service — top 8
  const serviceChartData = useMemo<ServiceData[]>(() => {
    const map: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const service = inv.service || "Sin servicio";
      map[service] = (map[service] || 0) + inv.amount;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [paidInvoices]);

  // Revenue by doctor
  const doctorChartData = useMemo<DoctorData[]>(() => {
    const map: Record<string, number> = {};
    for (const inv of paidInvoices) {
      let doctorName = "Sin doctor asignado";
      if (inv.appointment_id) {
        const doctorId = appointmentDoctorMap[inv.appointment_id];
        if (doctorId && doctorMap[doctorId]) {
          doctorName = doctorMap[doctorId];
        }
      }
      map[doctorName] = (map[doctorName] || 0) + inv.amount;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name, total }));
  }, [paidInvoices, appointmentDoctorMap, doctorMap]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return <Loading />;
  }

  const selectClass =
    "rounded-[8px] border border-border bg-surface px-3 py-2 text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
            Reportes Financieros
          </h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">
            Resumen de ingresos, servicios y producción
          </p>
        </div>

        {/* Month / Year Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className={selectClass}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={selectClass}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="Ingresos del Mes"
          value={formatCurrency(monthRevenue)}
          color="#6366f1"
        />
        <KpiCard
          icon={Receipt}
          label="Ticket Promedio"
          value={formatCurrency(avgTicket)}
          color="#f59e0b"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Cobrado (Año)"
          value={formatCurrency(yearPaid)}
          color="#10b981"
        />
        <KpiCard
          icon={Percent}
          label="Tasa de Cobro"
          value={`${collectionRate}%`}
          color="#ef4444"
        />
      </div>

      {/* Charts Row 1: Monthly Revenue + Revenue by Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#475569", fontSize: 11 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: "#475569", fontSize: 11 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickFormatter={(v: number) => formatCurrency(v)}
                    width={80}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={renderPieLabel}
                      labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                    >
                      {serviceChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value: string) =>
                        value.length > 20 ? value.slice(0, 20) + "..." : value
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-72 text-foreground-secondary text-[0.875rem]">
                No hay datos de servicios
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Revenue by Doctor */}
      <Card>
        <CardHeader>
          <CardTitle>Producción por Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          {doctorChartData.length > 0 ? (
            <div style={{ height: Math.max(250, doctorChartData.length * 50) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={doctorChartData}
                  layout="vertical"
                  margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#475569", fontSize: 11 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickFormatter={(v: number) => formatCurrency(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    width={160}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                    {doctorChartData.map((_, index) => (
                      <Cell
                        key={`doc-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-foreground-secondary text-[0.875rem]">
              No hay datos de producción por doctor
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card sub-component
// ---------------------------------------------------------------------------

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-[10px]"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[0.75rem] text-foreground-secondary truncate">
              {label}
            </p>
            <p className="text-[1.25rem] font-bold text-foreground truncate">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
