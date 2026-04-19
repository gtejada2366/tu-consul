import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Loading } from "../components/ui/loading";
import { Modal } from "../components/ui/modal";
import {
  Plus,
  Search,
  FlaskConical,
  DollarSign,
  Clock,
  Package,
  CheckCircle,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLabOrders, useLabOrderMutations, useLabPayments } from "../hooks/use-lab-orders";
import { usePatients } from "../hooks/use-patients";
import { useDoctors } from "../hooks/use-doctors";
import { inputClass, labelClass, textareaClass } from "../components/modals/form-classes";
import {
  LAB_ORDER_STATUSES,
  LAB_ORDER_STATUS_VARIANTS,
  LAB_PAYMENT_STATUSES,
  LAB_ITEMS,
  LAB_MATERIALS,
  PAYMENT_METHODS,
  toLocalDateStr,
} from "../lib/constants";
import { SearchableSelect } from "../components/ui/searchable-select";
import type { LabOrderWithRelations } from "../lib/types";
import { MiniOdontogram } from "../components/mini-odontogram";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function teethStringToArray(str: string): number[] {
  if (!str.trim()) return [];
  return str.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

function teethArrayToString(arr: number[]): string {
  return arr.sort((a, b) => a - b).join(", ");
}

function toggleTooth(current: string, tooth: number): string {
  const arr = teethStringToArray(current);
  const idx = arr.indexOf(tooth);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(tooth);
  return teethArrayToString(arr);
}

const emptyForm = {
  patient_id: "",
  doctor_id: "",
  lab_name: "",
  item_description: "",
  quantity: "1",
  teeth: "",
  material: "",
  shade: "",
  due_date: "",
  cost: "",
  notes: "",
};

export function Laboratory() {
  const { orders, loading, totalCost, pendingPayment, pendingCount, refetch } = useLabOrders();
  const { createLabOrder, markAsReceived, updateLabOrder, registerPayment, deletePayment, deleteLabOrder } = useLabOrderMutations();
  const { patients } = usePatients();
  const { doctors } = useDoctors();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ordered" | "in_progress" | "received">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "paid">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrderWithRelations | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<LabOrderWithRelations | null>(null);
  const [payingOrder, setPayingOrder] = useState<LabOrderWithRelations | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [payForm, setPayForm] = useState({ amount: "", payment_date: toLocalDateStr(new Date()), payment_method: "Efectivo", notes: "" });

  const { payments, refetchPayments } = useLabPayments(selectedOrder?.id ?? payingOrder?.id ?? null);

  const filtered = useMemo(() => orders.filter((o) => {
    const patientName = o.patient?.full_name || "";
    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.lab_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.item_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  }), [orders, searchTerm, statusFilter, paymentFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id || !form.lab_name.trim() || !form.item_description.trim()) {
      toast.error("Paciente, laboratorio y descripción son obligatorios");
      return;
    }
    setSaving(true);
    const { error } = await createLabOrder({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id || undefined,
      lab_name: form.lab_name.trim(),
      item_description: form.item_description.trim(),
      quantity: parseInt(form.quantity) || 1,
      teeth: form.teeth.trim() || undefined,
      material: form.material || undefined,
      shade: form.shade.trim() || undefined,
      due_date: form.due_date || undefined,
      cost: form.cost && !isNaN(parseFloat(form.cost)) && parseFloat(form.cost) > 0 ? parseFloat(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Pedido registrado");
      setShowCreateModal(false);
      setForm(emptyForm);
      refetch();
    }
  }

  function openPayment(order: LabOrderWithRelations) {
    const remaining = (order.cost || 0) - (order.amount_paid || 0);
    setPayingOrder(order);
    setPayForm({
      amount: remaining > 0 ? remaining.toFixed(2) : "",
      payment_date: toLocalDateStr(new Date()),
      payment_method: "Efectivo",
      notes: "",
    });
    setShowPaymentModal(true);
  }

  async function handleRegisterPayment() {
    if (!payingOrder) return;
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (!payForm.payment_date) {
      toast.error("Ingresa la fecha de pago");
      return;
    }
    setSaving(true);
    const { error } = await registerPayment(payingOrder.id, {
      amount,
      payment_date: payForm.payment_date,
      payment_method: payForm.payment_method,
      notes: payForm.notes.trim() || undefined,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Pago registrado");
      setShowPaymentModal(false);
      setPayingOrder(null);
      refetch();
      refetchPayments();
    }
  }

  async function handleDeletePayment(paymentId: string, orderId: string, amount: number) {
    setSaving(true);
    const { error } = await deletePayment(paymentId, orderId, amount);
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Pago eliminado");
      refetch();
      refetchPayments();
    }
  }

  async function handleMarkReceived(id: string) {
    setSaving(true);
    const { error } = await markAsReceived(id);
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Marcado como recibido");
      refetch();
      if (selectedOrder?.id === id) {
        setSelectedOrder({
          ...selectedOrder,
          status: "received",
          received_date: toLocalDateStr(new Date()),
        });
      }
    }
  }

  async function handleChangeStatus(id: string, status: string) {
    setSaving(true);
    const { error } = await updateLabOrder(id, { status });
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Estado actualizado");
      refetch();
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status: status as LabOrderWithRelations["status"] });
      }
    }
  }

  function openDetail(order: LabOrderWithRelations) {
    setSelectedOrder(order);
    setShowDetailModal(true);
  }

  function openEdit(order: LabOrderWithRelations) {
    setEditForm({
      patient_id: order.patient_id,
      doctor_id: order.doctor_id || "",
      lab_name: order.lab_name,
      item_description: order.item_description,
      quantity: String(order.quantity || 1),
      teeth: order.teeth || "",
      material: order.material || "",
      shade: order.shade || "",
      due_date: order.due_date || "",
      cost: order.cost != null ? String(order.cost) : "",
      notes: order.notes || "",
    });
    setSelectedOrder(order);
    setShowEditModal(true);
    setShowDetailModal(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!editForm.patient_id || !editForm.lab_name.trim() || !editForm.item_description.trim()) {
      toast.error("Paciente, laboratorio y descripción son obligatorios");
      return;
    }
    setSaving(true);
    const { error } = await updateLabOrder(selectedOrder.id, {
      patient_id: editForm.patient_id,
      doctor_id: editForm.doctor_id || null,
      lab_name: editForm.lab_name.trim(),
      item_description: editForm.item_description.trim(),
      quantity: parseInt(editForm.quantity) || 1,
      teeth: editForm.teeth.trim() || null,
      material: editForm.material || null,
      shade: editForm.shade.trim() || null,
      due_date: editForm.due_date || null,
      cost: editForm.cost && !isNaN(parseFloat(editForm.cost)) && parseFloat(editForm.cost) > 0 ? parseFloat(editForm.cost) : null,
      notes: editForm.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Pedido actualizado");
      setShowEditModal(false);
      refetch();
    }
  }

  function confirmDelete(order: LabOrderWithRelations) {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
    setShowDetailModal(false);
  }

  async function handleDelete() {
    if (!orderToDelete) return;
    setSaving(true);
    const { error } = await deleteLabOrder(orderToDelete.id);
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Pedido eliminado");
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      refetch();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[1.75rem] font-semibold text-foreground">
            Laboratorio
          </h1>
          <p className="text-[0.875rem] text-foreground-secondary mt-1">
            Pedidos al laboratorio dental
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
                  Total Pedidos
                </p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">
                  {orders.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
                  Pagos Pendientes
                </p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">
                  S/{pendingPayment.toLocaleString()}
                </p>
                <p className="text-[0.75rem] text-foreground-secondary mt-1">
                  {pendingCount} pedidos
                </p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
                  Costo Total
                </p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">
                  S/{totalCost.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
              <input
                type="text"
                placeholder="Buscar por paciente, laboratorio o item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px] text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "ordered", "in_progress", "received"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`h-10 px-3 text-[0.8125rem] font-medium rounded-[10px] transition-all ${
                    statusFilter === s
                      ? "bg-primary text-white"
                      : "bg-surface-alt text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "Todos" : LAB_ORDER_STATUSES[s]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "pending", "paid"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPaymentFilter(s)}
                  className={`h-10 px-3 text-[0.8125rem] font-medium rounded-[10px] transition-all ${
                    paymentFilter === s
                      ? "bg-primary text-white"
                      : "bg-surface-alt text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "Pago: Todos" : LAB_PAYMENT_STATUSES[s]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Loading />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-alt border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Fecha
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Paciente
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Laboratorio
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Item
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Costo
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Estado
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Pago
                      </th>
                      <th className="text-left px-6 py-4 text-[0.75rem] font-medium text-foreground-secondary">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-surface-alt transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <span className="text-[0.875rem] text-foreground">
                            {formatDate(order.order_date)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[0.875rem] font-medium text-foreground">
                            {order.patient?.full_name || "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[0.875rem] text-foreground">{order.lab_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[0.875rem] text-foreground-secondary">
                            {order.item_description}
                            {(order.quantity || 1) > 1 && <span className="font-semibold text-foreground"> x{order.quantity}</span>}
                          </p>
                          {order.teeth && (
                            <p className="text-[0.75rem] text-foreground-secondary">
                              Pieza(s): {order.teeth}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground text-[0.875rem]">
                            {order.cost != null ? `S/${order.cost.toLocaleString()}` : "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={LAB_ORDER_STATUS_VARIANTS[order.status] || "default"}>
                            {LAB_ORDER_STATUSES[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                            {order.payment_status === "paid" ? "Pagado" : "Pendiente"}
                          </Badge>
                          {order.payment_status !== "paid" && (order.amount_paid || 0) > 0 && order.cost != null && (
                            <div className="mt-1">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-success rounded-full"
                                    style={{ width: `${Math.min(100, ((order.amount_paid || 0) / order.cost) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[0.625rem] text-foreground-secondary">
                                  {Math.round(((order.amount_paid || 0) / order.cost) * 100)}%
                                </span>
                              </div>
                              <p className="text-[0.6875rem] text-foreground-secondary mt-0.5">
                                S/{(order.amount_paid || 0).toLocaleString()} / S/{order.cost.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(order)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(order)}
                              className="text-danger hover:text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {order.payment_status !== "paid" && order.cost != null && order.cost > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openPayment(order)}
                                disabled={saving}
                              >
                                <DollarSign className="w-3.5 h-3.5 mr-1" />
                                Pagar
                              </Button>
                            )}
                            {order.status !== "received" && (
                              <Button
                                variant="tertiary"
                                size="sm"
                                onClick={() => handleMarkReceived(order.id)}
                                disabled={saving}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Recibido
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <FlaskConical className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                  <p className="text-[0.875rem] text-foreground-secondary">
                    No se encontraron pedidos de laboratorio
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Pedido de Laboratorio"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Paciente *</label>
              <SearchableSelect
                placeholder="Seleccionar paciente"
                options={patients
                  .filter((p) => p.status === "active")
                  .map((p) => ({ value: p.id, label: p.full_name }))}
                value={form.patient_id}
                onChange={(v) => setForm({ ...form, patient_id: v })}
              />
            </div>
            <div>
              <label className={labelClass}>Doctor</label>
              <SearchableSelect
                placeholder="Seleccionar doctor"
                options={doctors.map((d) => ({ value: d.id, label: d.full_name }))}
                value={form.doctor_id}
                onChange={(v) => setForm({ ...form, doctor_id: v })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Laboratorio *</label>
            <input
              type="text"
              className={inputClass}
              value={form.lab_name}
              onChange={(e) => setForm({ ...form, lab_name: e.target.value })}
              placeholder="Nombre del laboratorio dental"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Item / Trabajo *</label>
              <select
                className={inputClass}
                value={form.item_description}
                onChange={(e) => setForm({ ...form, item_description: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {LAB_ITEMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cantidad</label>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Pieza(s) Dental(es)</label>
            <div className="mt-1 p-3 bg-surface-alt border border-border rounded-[10px] overflow-x-auto">
              <MiniOdontogram
                selectedTeeth={teethStringToArray(form.teeth)}
                onToggle={(t) => setForm({ ...form, teeth: toggleTooth(form.teeth, t) })}
              />
            </div>
            {form.teeth && (
              <p className="text-[0.75rem] text-foreground-secondary mt-1">Seleccionadas: {form.teeth}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Material</label>
              <select
                className={inputClass}
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {LAB_MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Color / Shade</label>
              <input
                type="text"
                className={inputClass}
                value={form.shade}
                onChange={(e) => setForm({ ...form, shade: e.target.value })}
                placeholder="Ej: A2, B1"
              />
            </div>
            <div>
              <label className={labelClass}>Costo (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Fecha de Entrega Estimada</label>
            <input
              type="date"
              className={inputClass}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              className={textareaClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Indicaciones especiales para el laboratorio"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="tertiary"
              size="md"
              onClick={() => setShowCreateModal(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>
              {saving ? "Registrando..." : "Registrar Pedido"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Pedido de Laboratorio"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Paciente *</label>
              <SearchableSelect
                placeholder="Seleccionar paciente"
                options={patients
                  .filter((p) => p.status === "active")
                  .map((p) => ({ value: p.id, label: p.full_name }))}
                value={editForm.patient_id}
                onChange={(v) => setEditForm({ ...editForm, patient_id: v })}
              />
            </div>
            <div>
              <label className={labelClass}>Doctor</label>
              <SearchableSelect
                placeholder="Seleccionar doctor"
                options={doctors.map((d) => ({ value: d.id, label: d.full_name }))}
                value={editForm.doctor_id}
                onChange={(v) => setEditForm({ ...editForm, doctor_id: v })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Laboratorio *</label>
            <input
              type="text"
              className={inputClass}
              value={editForm.lab_name}
              onChange={(e) => setEditForm({ ...editForm, lab_name: e.target.value })}
              placeholder="Nombre del laboratorio dental"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Item / Trabajo *</label>
              <select
                className={inputClass}
                value={editForm.item_description}
                onChange={(e) => setEditForm({ ...editForm, item_description: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {LAB_ITEMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cantidad</label>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Pieza(s) Dental(es)</label>
            <div className="mt-1 p-3 bg-surface-alt border border-border rounded-[10px] overflow-x-auto">
              <MiniOdontogram
                selectedTeeth={teethStringToArray(editForm.teeth)}
                onToggle={(t) => setEditForm({ ...editForm, teeth: toggleTooth(editForm.teeth, t) })}
              />
            </div>
            {editForm.teeth && (
              <p className="text-[0.75rem] text-foreground-secondary mt-1">Seleccionadas: {editForm.teeth}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Material</label>
              <select
                className={inputClass}
                value={editForm.material}
                onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {LAB_MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Color / Shade</label>
              <input
                type="text"
                className={inputClass}
                value={editForm.shade}
                onChange={(e) => setEditForm({ ...editForm, shade: e.target.value })}
                placeholder="Ej: A2, B1"
              />
            </div>
            <div>
              <label className={labelClass}>Costo (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={editForm.cost}
                onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Fecha de Entrega Estimada</label>
            <input
              type="date"
              className={inputClass}
              value={editForm.due_date}
              onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              className={textareaClass}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Indicaciones especiales para el laboratorio"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="tertiary"
              size="md"
              onClick={() => setShowEditModal(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar Pedido"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[0.875rem] text-foreground-secondary">
            ¿Estás seguro de que deseas eliminar este pedido de laboratorio?
            {orderToDelete && (
              <span className="block mt-2 font-medium text-foreground">
                {orderToDelete.item_description} — {orderToDelete.patient?.full_name || "Sin paciente"}
              </span>
            )}
          </p>
          <p className="text-[0.8125rem] text-danger">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="tertiary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDelete}
              disabled={saving}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {saving ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Registrar Pago"
        size="md"
      >
        {payingOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-surface-alt rounded-[10px]">
              <p className="text-[0.875rem] font-medium text-foreground">
                {payingOrder.item_description} — {payingOrder.patient?.full_name}
              </p>
              <p className="text-[0.75rem] text-foreground-secondary mt-0.5">
                {payingOrder.lab_name}
              </p>
              <div className="flex items-center gap-4 mt-2 text-[0.75rem] text-foreground-secondary">
                <span>Total: <strong className="text-primary">S/{(payingOrder.cost || 0).toFixed(2)}</strong></span>
                <span>Pagado: <strong className="text-success">S/{(payingOrder.amount_paid || 0).toFixed(2)}</strong></span>
                <span>Saldo: <strong className="text-warning">S/{((payingOrder.cost || 0) - (payingOrder.amount_paid || 0)).toFixed(2)}</strong></span>
              </div>
              {(payingOrder.amount_paid || 0) > 0 && payingOrder.cost != null && payingOrder.cost > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: `${Math.min(100, ((payingOrder.amount_paid || 0) / payingOrder.cost) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Monto (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(payingOrder.cost || 0) - (payingOrder.amount_paid || 0)}
                  className={inputClass}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  placeholder={((payingOrder.cost || 0) - (payingOrder.amount_paid || 0)).toFixed(2)}
                />
              </div>
              <div>
                <label className={labelClass}>Fecha de Pago *</label>
                <input
                  type="date"
                  className={inputClass}
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Método de Pago</label>
              <select
                className={inputClass}
                value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Notas</label>
              <input
                type="text"
                className={inputClass}
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Nota del pago (opcional)"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="tertiary" size="md" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={handleRegisterPayment} disabled={saving}>
                <DollarSign className="w-4 h-4 mr-1.5" />
                {saving ? "Procesando..." : "Registrar Pago"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalle del Pedido"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Status badges */}
            <div className="flex items-center gap-3">
              <Badge variant={LAB_ORDER_STATUS_VARIANTS[selectedOrder.status] || "default"}>
                {LAB_ORDER_STATUSES[selectedOrder.status]}
              </Badge>
              <Badge variant={selectedOrder.payment_status === "paid" ? "success" : "warning"}>
                {selectedOrder.payment_status === "paid" ? "Pagado" : "Pago Pendiente"}
              </Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Paciente
                </p>
                <p className="text-[0.875rem] text-foreground">
                  {selectedOrder.patient?.full_name}
                </p>
              </div>
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Doctor
                </p>
                <p className="text-[0.875rem] text-foreground">
                  {selectedOrder.doctor?.full_name}
                </p>
              </div>
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Laboratorio
                </p>
                <p className="text-[0.875rem] text-foreground">{selectedOrder.lab_name}</p>
              </div>
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Item
                </p>
                <p className="text-[0.875rem] text-foreground">
                  {selectedOrder.item_description}
                  {(selectedOrder.quantity || 1) > 1 && <span className="font-semibold"> x{selectedOrder.quantity}</span>}
                </p>
              </div>
              {selectedOrder.teeth && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                    Pieza(s)
                  </p>
                  <p className="text-[0.875rem] text-foreground">{selectedOrder.teeth}</p>
                </div>
              )}
              {selectedOrder.material && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                    Material
                  </p>
                  <p className="text-[0.875rem] text-foreground">{selectedOrder.material}</p>
                </div>
              )}
              {selectedOrder.shade && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                    Color / Shade
                  </p>
                  <p className="text-[0.875rem] text-foreground">{selectedOrder.shade}</p>
                </div>
              )}
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Costo
                </p>
                <p className="text-[0.875rem] font-semibold text-foreground">
                  {selectedOrder.cost != null
                    ? `S/${selectedOrder.cost.toLocaleString()}`
                    : "—"}
                </p>
              </div>
              {selectedOrder.cost != null && selectedOrder.cost > 0 && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                    Pagado / Saldo
                  </p>
                  <p className="text-[0.875rem] text-foreground">
                    <span className="text-success font-semibold">S/{(selectedOrder.amount_paid || 0).toLocaleString()}</span>
                    {" / "}
                    <span className="text-warning font-semibold">S/{(selectedOrder.cost - (selectedOrder.amount_paid || 0)).toLocaleString()}</span>
                  </p>
                </div>
              )}
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Fecha de Pedido
                </p>
                <p className="text-[0.875rem] text-foreground">
                  {formatDate(selectedOrder.order_date)}
                </p>
              </div>
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Fecha de Entrega
                </p>
                <p className="text-[0.875rem] text-foreground">
                  {formatDate(selectedOrder.due_date)}
                </p>
              </div>
              {selectedOrder.received_date && (
                <div>
                  <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                    Fecha Recibido
                  </p>
                  <p className="text-[0.875rem] text-foreground">
                    {formatDate(selectedOrder.received_date)}
                  </p>
                </div>
              )}
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-0.5">
                  Notas
                </p>
                <p className="text-[0.875rem] text-foreground">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Payment progress */}
            {selectedOrder.cost != null && selectedOrder.cost > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[0.75rem] font-medium text-foreground-secondary">
                    Progreso de Pago
                  </p>
                  <span className="text-[0.75rem] font-medium text-foreground">
                    {Math.round(((selectedOrder.amount_paid || 0) / selectedOrder.cost) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((selectedOrder.amount_paid || 0) / selectedOrder.cost) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[0.6875rem] text-foreground-secondary">
                  <span>Pagado: S/{(selectedOrder.amount_paid || 0).toLocaleString()}</span>
                  <span>Total: S/{selectedOrder.cost.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payment history */}
            {payments.length > 0 && (
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
                  Historial de Pagos
                </p>
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-surface-alt rounded-[10px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.875rem] font-semibold text-success">
                            S/{p.amount.toLocaleString()}
                          </span>
                          <Badge variant="default">{p.payment_method}</Badge>
                        </div>
                        <p className="text-[0.6875rem] text-foreground-secondary mt-0.5">
                          {formatDate(p.payment_date)}
                          {p.notes && ` — ${p.notes}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePayment(p.id, p.lab_order_id, p.amount)}
                        className="text-danger hover:text-danger hover:bg-danger/10 flex-shrink-0"
                        disabled={saving}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status change */}
            {selectedOrder.status !== "received" && (
              <div>
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
                  Cambiar Estado
                </p>
                <div className="flex gap-2">
                  {(["ordered", "in_progress", "received"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleChangeStatus(selectedOrder.id, s)}
                      disabled={saving || selectedOrder.status === s}
                      className={`h-9 px-3 text-[0.8125rem] font-medium rounded-[10px] transition-all ${
                        selectedOrder.status === s
                          ? "bg-primary text-white"
                          : "bg-surface-alt text-foreground-secondary hover:text-foreground"
                      } disabled:opacity-50`}
                    >
                      {LAB_ORDER_STATUSES[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => openEdit(selectedOrder)}
                >
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Editar
                </Button>
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => confirmDelete(selectedOrder)}
                  className="text-danger hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Eliminar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {selectedOrder.payment_status !== "paid" && selectedOrder.cost != null && selectedOrder.cost > 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setShowDetailModal(false);
                      openPayment(selectedOrder);
                    }}
                    disabled={saving}
                  >
                    <DollarSign className="w-4 h-4 mr-1.5" />
                    Registrar Pago
                  </Button>
                )}
                {selectedOrder.status !== "received" && (
                  <Button
                    variant="tertiary"
                    size="md"
                    onClick={() => handleMarkReceived(selectedOrder.id)}
                    disabled={saving}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Marcar como Recibido
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
