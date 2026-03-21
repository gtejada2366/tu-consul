import { useState, useMemo } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { FileCheck, Search, FileText, Receipt } from "lucide-react";
import { useComprobantes } from "../hooks/use-comprobantes";

const SUNAT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  accepted: "Aceptada",
  accepted_with_observations: "Aceptada c/obs",
  rejected: "Rechazada",
  error: "Error",
  voided: "Anulada",
};

const SUNAT_STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "default" | "primary"> = {
  pending: "warning",
  sent: "primary",
  accepted: "success",
  accepted_with_observations: "warning",
  rejected: "danger",
  error: "danger",
  voided: "default",
};

const TIPO_LABELS: Record<string, string> = {
  "01": "Factura",
  "03": "Boleta",
  "07": "Nota de Crédito",
  "08": "Nota de Débito",
};

export function Comprobantes() {
  const { comprobantes, loading } = useComprobantes();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  const filtered = useMemo(() => comprobantes.filter((c) => {
    const matchesSearch =
      !search ||
      c.cliente_razon_social.toLowerCase().includes(search.toLowerCase()) ||
      `${c.serie}-${String(c.correlativo).padStart(8, "0")}`.includes(search);
    const matchesTipo = !tipoFilter || c.tipo_comprobante === tipoFilter;
    return matchesSearch && matchesTipo;
  }), [comprobantes, search, tipoFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
          Comprobantes Electrónicos
        </h1>
        <p className="text-[0.875rem] text-foreground-secondary mt-1">
          Boletas, facturas y notas emitidas a SUNAT
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente o número..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Buscar comprobantes"
                    className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  aria-label="Filtrar por tipo de comprobante"
                  className="h-10 px-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos los tipos</option>
                  <option value="03">Boletas</option>
                  <option value="01">Facturas</option>
                  <option value="07">Notas de Crédito</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[1.5rem] font-bold text-primary">
                  {comprobantes.filter((c) => c.tipo_comprobante === "03").length}
                </p>
                <p className="text-[0.75rem] text-foreground-secondary">Boletas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[1.5rem] font-bold text-primary">
                  {comprobantes.filter((c) => c.tipo_comprobante === "01").length}
                </p>
                <p className="text-[0.75rem] text-foreground-secondary">Facturas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[1.5rem] font-bold text-success">
                  {comprobantes.filter((c) => c.sunat_status === "accepted" || c.sunat_status === "accepted_with_observations").length}
                </p>
                <p className="text-[0.75rem] text-foreground-secondary">Aceptadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[1.5rem] font-bold text-warning">
                  {comprobantes.filter((c) => c.sunat_status === "pending").length}
                </p>
                <p className="text-[0.75rem] text-foreground-secondary">Pendientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-alt border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">Tipo</th>
                      <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">Número</th>
                      <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">Cliente</th>
                      <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">Fecha</th>
                      <th className="text-right px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">Total</th>
                      <th className="text-left px-4 py-3 text-[0.75rem] font-medium text-foreground-secondary">Estado SUNAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-alt transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.tipo_comprobante === "01" ? (
                              <FileText className="w-4 h-4 text-primary" />
                            ) : (
                              <Receipt className="w-4 h-4 text-foreground-secondary" />
                            )}
                            <span className="text-[0.8125rem] font-medium text-foreground">
                              {TIPO_LABELS[c.tipo_comprobante] || c.tipo_comprobante}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[0.8125rem] font-mono text-foreground">
                            {c.serie}-{String(c.correlativo).padStart(8, "0")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[0.8125rem] text-foreground">{c.cliente_razon_social}</p>
                          <p className="text-[0.6875rem] text-foreground-secondary">{c.cliente_numero_doc}</p>
                        </td>
                        <td className="px-4 py-3 text-[0.8125rem] text-foreground-secondary whitespace-nowrap">
                          {c.fecha_emision.split("-").reverse().join("/")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[0.875rem] font-semibold text-foreground">
                            S/{Number(c.total_venta).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={SUNAT_STATUS_COLORS[c.sunat_status] || "default"}>
                            {SUNAT_STATUS_LABELS[c.sunat_status] || c.sunat_status}
                          </Badge>
                          {c.sunat_description && c.sunat_status !== "accepted" && (
                            <p className="text-[0.625rem] text-foreground-secondary mt-0.5 max-w-[200px] truncate">
                              {c.sunat_description}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                  <p className="text-[0.875rem] text-foreground-secondary">
                    {comprobantes.length === 0
                      ? "No hay comprobantes emitidos. Configura SUNAT en Configuración."
                      : "No se encontraron comprobantes con esos filtros"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
