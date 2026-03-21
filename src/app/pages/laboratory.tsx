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
} from "lucide-react";
import { useLabOrders, useLabOrderMutations } from "../hooks/use-lab-orders";
import { usePatients } from "../hooks/use-patients";
import { useDoctors } from "../hooks/use-doctors";
import { inputClass, labelClass, textareaClass } from "../components/modals/form-classes";
import {
  LAB_ORDER_STATUSES,
  LAB_ORDER_STATUS_VARIANTS,
  LAB_PAYMENT_STATUSES,
  LAB_ITEMS,
  LAB_MATERIALS,
  toLocalDateStr,
} from "../lib/constants";
import { SearchableSelect } from "../components/ui/searchable-select";
import type { LabOrderWithRelations } from "../lib/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

const emptyForm = {
  patient_id: "",
  doctor_id: "",
  lab_name: "",
  item_description: "",
  teeth: "",
  material: "",
  shade: "",
  due_date: "",
  cost: "",
  notes: "",
};

export function Laboratory() {
  const { orders, loading, totalCost, pendingPayment, pendingCount, refetch } = useLabOrders();
  const { createLabOrder, markAsPaid, markAsReceived, updateLabOrder } = useLabOrderMutations();
  const { patients } = usePatients();
  const { doctors } = useDoctors();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ordered" | "in_progress" | "received">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "paid">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrderWithRelations | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  async function handleMarkPaid(id: string) {
    setSaving(true);
    const { error } = await markAsPaid(id);
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Marcado como pagado");
      refetch();
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, payment_status: "paid" });
      }
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
                <p className="text-[0.75rem] font-medium text-foreground-secondary mb-2">
                  Costo Total
                </p>
                <p className="text-[1.75rem] font-semibold text-foreground leading-none">
                  S/{totalCost.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-success/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-success" />
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
                            {order.payment_status !== "paid" && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMarkPaid(order.id)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
              <label className={labelClass}>Pieza(s) Dental(es)</label>
              <input
                type="text"
                className={inputClass}
                value={form.teeth}
                onChange={(e) => setForm({ ...form, teeth: e.target.value })}
                placeholder="Ej: 1.1, 2.3"
              />
            </div>
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
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              {selectedOrder.payment_status !== "paid" && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleMarkPaid(selectedOrder.id)}
                  disabled={saving}
                >
                  <DollarSign className="w-4 h-4 mr-1.5" />
                  {saving ? "Procesando..." : "Marcar como Pagado"}
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
        )}
      </Modal>
    </div>
  );
}
