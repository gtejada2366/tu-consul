import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import { Plus, Search, Download, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { useInvoices, useInvoiceMutations } from "../hooks/use-invoices";
import { usePatients } from "../hooks/use-patients";
import { inputClass, labelClass, textareaClass } from "../components/modals/form-classes";

const statusConfig = {
  paid: { label: "Pagada", variant: "success" as const, icon: CheckCircle },
  pending: { label: "Pendiente", variant: "warning" as const, icon: Clock },
  overdue: { label: "Vencida", variant: "danger" as const, icon: XCircle },
};

export function Billing() {
  const { invoices, loading, totalRevenue, pendingRevenue, collectionRate, refetch } = useInvoices();
  const { createInvoice, markAsPaid } = useInvoiceMutations();
  const { patients } = usePatients();
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState("");
  const [payingPatientName, setPayingPatientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [saving, setSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ patient_id: "", amount: "", service: "", notes: "" });

  const filteredBilling = invoices.filter(bill => {
    const patientName = bill.patient?.full_name || "";
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) || bill.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceForm.patient_id || !invoiceForm.amount || !invoiceForm.service.trim()) {
      toast.error("Paciente, monto y servicio son obligatorios"); return;
    }
    setSaving(true);
    const { error } = await createInvoice({
      patient_id: invoiceForm.patient_id, amount: parseFloat(invoiceForm.amount),
      service: invoiceForm.service.trim(), notes: invoiceForm.notes.trim() || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Cobro registrado"); setShowCreateModal(false); setInvoiceForm({ patient_id: "", amount: "", service: "", notes: "" }); refetch(); }
  }

  async function handleMarkAsPaid() {
    if (!payingInvoiceId) return;
    setSaving(true);
    const { error } = await markAsPaid(payingInvoiceId, paymentMethod);
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Pago registrado"); setShowPayModal(false); refetch(); }
  }

  function openPayModal(invoiceId: string, patientName: string) {
    setPayingInvoiceId(invoiceId);
    setPayingPatientName(patientName);
    setPaymentMethod("Efectivo");
    setShowPayModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Facturación</h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">Gestiona cobros y facturas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="tertiary" size="md" onClick={() => {
            if (filteredBilling.length === 0) { toast.error("No hay facturas para exportar"); return; }
            const header = "Factura,Paciente,Servicio,Fecha,Monto,Método de Pago,Estado\n";
            const rows = filteredBilling.map(b =>
              `"${b.invoice_number}","${b.patient?.full_name || '-'}","${b.service}","${new Date(b.date).toLocaleDateString('es-ES')}","${b.amount}","${b.payment_method || '-'}","${b.status === 'paid' ? 'Pagada' : b.status === 'pending' ? 'Pendiente' : 'Vencida'}"`
            ).join("\n");
            const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `facturas_${new Date().toISOString().split("T")[0]}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success("CSV exportado");
          }}><Download className="w-4 h-4 mr-2" />Exportar</Button>
          <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Cobro</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Ingresos del Mes</p><p className="text-[1.75rem] font-semibold text-foreground">${totalRevenue.toLocaleString()}</p></div><div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-primary" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Cobros Pendientes</p><p className="text-[1.75rem] font-semibold text-foreground">${pendingRevenue.toLocaleString()}</p><p className="text-[0.75rem] text-foreground-secondary mt-1">{invoices.filter(b => b.status !== "paid").length} facturas</p></div><div className="w-12 h-12 rounded-[10px] bg-warning/10 flex items-center justify-center"><Clock className="w-6 h-6 text-warning" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Tasa de Cobro</p><p className="text-[1.75rem] font-semibold text-foreground">{collectionRate}%</p><p className="text-[0.75rem] text-success mt-1">{collectionRate >= 80 ? "Excelente" : collectionRate >= 60 ? "Buena" : "Mejorable"}</p></div><div className="w-12 h-12 rounded-[10px] bg-success/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-success" /></div></div></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
              <input type="text" placeholder="Buscar por paciente o número de factura..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["all","paid","pending","overdue"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-[0.75rem] font-medium rounded-[10px] transition-all ${statusFilter === s ? "bg-primary text-white" : "bg-surface-alt text-foreground-secondary hover:text-foreground"}`}>
                {s === "all" ? "Todas" : s === "paid" ? "Pagadas" : s === "pending" ? "Pendientes" : "Vencidas"}
              </button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <Loading /> : (<>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-alt border-b border-border"><tr>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Factura</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Paciente</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Servicio</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Fecha</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Monto</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Método de Pago</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Estado</th>
                <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">Acciones</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filteredBilling.map((bill) => {
                  const statusInfo = statusConfig[bill.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo?.icon || Clock;
                  const patientName = bill.patient?.full_name || "-";
                  return (
                    <tr key={bill.id} className="hover:bg-surface-alt transition-colors duration-150">
                      <td className="px-6 py-4"><p className="font-semibold text-foreground text-[0.875rem]">{bill.invoice_number}</p></td>
                      <td className="px-6 py-4"><p className="text-[0.875rem] text-foreground">{patientName}</p></td>
                      <td className="px-6 py-4"><p className="text-[0.875rem] text-foreground-secondary">{bill.service}</p></td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-foreground-secondary" /><span className="text-[0.875rem] text-foreground">{new Date(bill.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div></td>
                      <td className="px-6 py-4"><p className="font-semibold text-foreground text-[0.875rem]">${bill.amount.toLocaleString()}</p></td>
                      <td className="px-6 py-4"><p className="text-[0.875rem] text-foreground-secondary">{bill.payment_method || "-"}</p></td>
                      <td className="px-6 py-4">{statusInfo && <Badge variant={statusInfo.variant}><StatusIcon className="w-3 h-3 mr-1" />{statusInfo.label}</Badge>}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {bill.status !== "paid" && (
                            <Button variant="primary" size="sm" onClick={() => openPayModal(bill.id, patientName)}>Cobrar</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredBilling.length === 0 && (
            <div className="text-center py-12"><Search className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" /><p className="text-[0.875rem] text-foreground-secondary">No se encontraron facturas</p></div>
          )}
        </>)}
      </CardContent></Card>

      {/* New Invoice Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Cobro" size="md">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className={labelClass}>Paciente *</label>
            <select className={inputClass} value={invoiceForm.patient_id} onChange={e => setInvoiceForm({ ...invoiceForm, patient_id: e.target.value })}>
              <option value="">Seleccionar paciente</option>
              {patients.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Monto ($) *</label><input type="number" step="0.01" min="0" className={inputClass} placeholder="0.00" value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} /></div>
            <div><label className={labelClass}>Servicio *</label>
              <select className={inputClass} value={invoiceForm.service} onChange={e => setInvoiceForm({ ...invoiceForm, service: e.target.value })}>
                <option value="">Seleccionar</option>
                {["Consulta General","Primera Consulta","Limpieza Dental","Tratamiento de Conducto","Corona Dental","Extracción","Ortodoncia","Endodoncia","Blanqueamiento","Radiografía"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Notas</label><textarea className={textareaClass} placeholder="Notas adicionales..." value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowCreateModal(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>{saving ? "Registrando..." : "Registrar Cobro"}</Button>
          </div>
        </form>
      </Modal>

      {/* Mark as Paid Modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Pago" size="sm">
        <div className="space-y-4">
          <p className="text-[0.875rem] text-foreground-secondary">Registrar pago de <strong className="text-foreground">{payingPatientName}</strong></p>
          <div>
            <label className={labelClass}>Método de Pago</label>
            <select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              {["Efectivo","Tarjeta de Crédito","Tarjeta de Débito","Transferencia","Mercado Pago"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowPayModal(false)}>Cancelar</Button>
            <Button variant="primary" size="md" onClick={handleMarkAsPaid} disabled={saving}>{saving ? "Procesando..." : "Confirmar Pago"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
