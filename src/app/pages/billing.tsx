import { useState, useMemo } from "react";
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
import { BILLING_SERVICES, PAYMENT_METHODS, toLocalDateStr } from "../lib/constants";
import { SearchableSelect } from "../components/ui/searchable-select";

const statusConfig = {
  paid: { label: "Pagada", variant: "success" as const, icon: CheckCircle },
  pending: { label: "Pendiente", variant: "warning" as const, icon: Clock },
  overdue: { label: "Vencida", variant: "danger" as const, icon: XCircle },
};

export function Billing() {
  const { invoices, loading, totalRevenue, pendingRevenue, collectionRate, refetch } = useInvoices();
  const { createInvoice, registerPayment } = useInvoiceMutations();
  const { patients } = usePatients();
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState("");
  const [payingPatientName, setPayingPatientName] = useState("");
  const [payingAmount, setPayingAmount] = useState("");
  const [payingTotal, setPayingTotal] = useState(0);
  const [payingPaid, setPayingPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [saving, setSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ patient_id: "", amount: "", service: "", notes: "" });
  const [amountError, setAmountError] = useState("");

  const filteredBilling = useMemo(() => invoices.filter(bill => {
    const patientName = bill.patient?.full_name || "";
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) || bill.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [invoices, searchTerm, statusFilter]);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceForm.patient_id) { toast.error("Selecciona un paciente"); return; }
    if (!invoiceForm.service.trim()) { toast.error("Selecciona un servicio"); return; }
    const amount = parseFloat(invoiceForm.amount);
    if (!invoiceForm.amount || isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un número mayor a 0"); return;
    }
    if (amount > 999999) {
      toast.error("El monto no puede exceder S/999,999"); return;
    }
    setSaving(true);
    const { error } = await createInvoice({
      patient_id: invoiceForm.patient_id, amount,
      service: invoiceForm.service.trim(), notes: invoiceForm.notes.trim() || undefined,
    });
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success("Cobro registrado"); setShowCreateModal(false); setInvoiceForm({ patient_id: "", amount: "", service: "", notes: "" }); refetch(); }
  }

  async function handleRegisterPayment() {
    if (!payingInvoiceId) return;
    const amt = parseFloat(payingAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Ingresa un monto válido"); return; }
    const remaining = payingTotal - payingPaid;
    if (amt > remaining + 0.01) { toast.error(`El monto excede el saldo pendiente (S/${remaining.toFixed(2)})`); return; }
    setSaving(true);
    const { error } = await registerPayment(payingInvoiceId, amt, paymentMethod);
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success(`Pago de S/${amt.toFixed(2)} registrado`); setShowPayModal(false); refetch(); }
  }

  function openPayModal(invoiceId: string, patientName: string, total: number, paid: number) {
    setPayingInvoiceId(invoiceId);
    setPayingPatientName(patientName);
    setPayingTotal(total);
    setPayingPaid(paid);
    const remaining = total - paid;
    setPayingAmount(remaining.toFixed(2));
    setPaymentMethod("Efectivo");
    setShowPayModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">Ingresos</h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">Gestiona cobros y facturas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="tertiary" size="md" onClick={() => {
            if (filteredBilling.length === 0) { toast.error("No hay facturas para exportar"); return; }
            const header = "Factura,Paciente,Servicio,Fecha,Monto,Método de Pago,Estado\n";
            const rows = filteredBilling.map(b =>
              `"${b.invoice_number}","${b.patient?.full_name || '-'}","${b.service}","${b.date.split('-').reverse().join('/')}","${b.amount}","${b.payment_method || '-'}","${b.status === 'paid' ? 'Pagada' : b.status === 'pending' ? 'Pendiente' : 'Vencida'}"`
            ).join("\n");
            const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `facturas_${toLocalDateStr(new Date())}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success("CSV exportado");
          }}><Download className="w-4 h-4 mr-2" />Exportar</Button>
          <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Cobro</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Ingresos del Mes</p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">S/{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Cobros Pendientes</p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">S/{pendingRevenue.toLocaleString()}</p>
                <p className="text-[0.75rem] text-foreground-secondary mt-1">{invoices.filter(b => b.status !== "paid").length} facturas</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">Tasa de Cobro</p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">{collectionRate}%</p>
                <p className="text-[0.75rem] text-success mt-1">{collectionRate >= 80 ? "Excelente" : collectionRate >= 60 ? "Buena" : "Mejorable"}</p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-success/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card><CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
            <input type="text" placeholder="Buscar factura por paciente o número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar facturas"
              className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150" />
          </div>
          <div className="flex items-center gap-1.5">
            {(["all","paid","pending","overdue"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`h-10 px-3 text-[0.8125rem] font-medium rounded-[10px] transition-all ${statusFilter === s ? "bg-primary text-white" : "bg-surface-alt text-foreground-secondary hover:text-foreground"}`}>
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
                      <td className="px-6 py-4"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-foreground-secondary" /><span className="text-[0.875rem] text-foreground">{(() => { const [y,m,d] = bill.date.split("-"); const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]; return `${d} ${months[parseInt(m)-1]} ${y}`; })()}</span></div></td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground text-[0.875rem]">S/{bill.amount.toLocaleString()}</p>
                        {bill.status !== "paid" && (bill.amount_paid || 0) > 0 && (
                          <div className="mt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                                <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(100, ((bill.amount_paid || 0) / bill.amount) * 100)}%` }} />
                              </div>
                              <span className="text-[0.625rem] text-foreground-secondary">{Math.round(((bill.amount_paid || 0) / bill.amount) * 100)}%</span>
                            </div>
                            <p className="text-[0.6875rem] text-foreground-secondary mt-0.5">
                              Pagado: S/{(bill.amount_paid || 0).toLocaleString()} · Saldo: S/{(bill.amount - (bill.amount_paid || 0)).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><p className="text-[0.875rem] text-foreground-secondary">{bill.payment_method || "-"}</p></td>
                      <td className="px-6 py-4">{statusInfo && <Badge variant={statusInfo.variant}><StatusIcon className="w-3 h-3 mr-1" />{statusInfo.label}</Badge>}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {bill.status !== "paid" && (
                            <Button variant="primary" size="sm" onClick={() => openPayModal(bill.id, patientName, bill.amount, bill.amount_paid || 0)}>Cobrar</Button>
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
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
              <p className="text-[0.875rem] text-foreground-secondary">
                {searchTerm || statusFilter !== "all" ? "No se encontraron facturas con esos filtros" : "Aún no hay facturas registradas"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />Registrar primer cobro
                </Button>
              )}
            </div>
          )}
        </>)}
      </CardContent></Card>

      {/* New Invoice Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Cobro" size="md">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className={labelClass}>Paciente *</label>
            <SearchableSelect
              placeholder="Seleccionar paciente"
              options={patients.filter(p => p.status === "active").map(p => ({ value: p.id, label: p.full_name }))}
              value={invoiceForm.patient_id}
              onChange={v => setInvoiceForm({ ...invoiceForm, patient_id: v })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Monto (S/) *</label>
              <input type="number" step="0.01" min="0" className={`${inputClass} ${amountError ? "!border-danger" : ""}`} placeholder="0.00" value={invoiceForm.amount}
                onChange={e => {
                  setInvoiceForm({ ...invoiceForm, amount: e.target.value });
                  const v = parseFloat(e.target.value);
                  setAmountError(e.target.value && (isNaN(v) || v <= 0) ? "Debe ser mayor a 0" : v > 999999 ? "Máximo S/999,999" : "");
                }} />
              {amountError && <p className="text-[0.75rem] text-danger mt-1">{amountError}</p>}
            </div>
            <div><label className={labelClass}>Servicio *</label>
              <select className={inputClass} value={invoiceForm.service} onChange={e => setInvoiceForm({ ...invoiceForm, service: e.target.value })}>
                <option value="">Seleccionar</option>
                {BILLING_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
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

      {/* Register Payment Modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Cobro" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-surface-alt rounded-[10px]">
            <p className="text-[0.875rem] font-medium text-foreground">{payingPatientName}</p>
            <div className="flex items-center gap-4 mt-1 text-[0.75rem] text-foreground-secondary">
              <span>Total: <strong className="text-primary">S/{payingTotal.toFixed(2)}</strong></span>
              <span>Pagado: <strong className="text-success">S/{payingPaid.toFixed(2)}</strong></span>
              <span>Saldo: <strong className="text-warning">S/{(payingTotal - payingPaid).toFixed(2)}</strong></span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Monto a cobrar (S/) *</label>
              <input type="number" step="0.01" min="0.01" max={payingTotal - payingPaid} className={inputClass}
                placeholder={(payingTotal - payingPaid).toFixed(2)}
                value={payingAmount}
                onChange={e => setPayingAmount(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Método de Pago</label>
              <select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="tertiary" size="md" onClick={() => setShowPayModal(false)}>Cancelar</Button>
            <Button variant="primary" size="md" onClick={handleRegisterPayment} disabled={saving}>{saving ? "Procesando..." : "Registrar Cobro"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
