import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { LabOrderWithRelations, LabPayment } from "../lib/types";
import { toLocalDateStr } from "../lib/constants";

export function useLabOrders() {
  const { clinic } = useAuth();
  const [orders, setOrders] = useState<LabOrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("lab_orders")
      .select("*, patient:patients(full_name), doctor:users(full_name)")
      .eq("clinic_id", clinic.id)
      .order("order_date", { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as LabOrderWithRelations[]);
    }
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalCost = orders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const pendingPayment = orders
    .filter((o) => o.payment_status === "pending")
    .reduce((sum, o) => sum + ((o.cost || 0) - (o.amount_paid || 0)), 0);
  const pendingCount = orders.filter((o) => o.payment_status === "pending").length;

  return { orders, loading, totalCost, pendingPayment, pendingCount, refetch: fetchOrders };
}

export function useLabPayments(orderId: string | null) {
  const { clinic } = useAuth();
  const [payments, setPayments] = useState<LabPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!clinic || !orderId) {
      setPayments([]);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("lab_payments")
      .select("*")
      .eq("clinic_id", clinic.id)
      .eq("lab_order_id", orderId)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setPayments(data as LabPayment[]);
    }
    setLoading(false);
  }, [clinic, orderId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, refetchPayments: fetchPayments };
}

export function useLabOrderMutations() {
  const { clinic, user } = useAuth();

  async function createLabOrder(data: {
    patient_id: string;
    doctor_id?: string;
    lab_name: string;
    item_description: string;
    teeth?: string;
    material?: string;
    shade?: string;
    due_date?: string;
    cost?: number;
    notes?: string;
  }) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase.from("lab_orders").insert({
      clinic_id: clinic.id,
      patient_id: data.patient_id,
      doctor_id: data.doctor_id || user?.id,
      lab_name: data.lab_name,
      item_description: data.item_description,
      teeth: data.teeth || null,
      material: data.material || null,
      shade: data.shade || null,
      order_date: toLocalDateStr(new Date()),
      due_date: data.due_date || null,
      status: "ordered",
      payment_status: "pending",
      cost: data.cost || null,
      amount_paid: 0,
      notes: data.notes || null,
    } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  async function updateLabOrder(id: string, updates: Record<string, unknown>) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase
      .from("lab_orders")
      .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  async function markAsPaid(id: string) {
    return updateLabOrder(id, { payment_status: "paid" });
  }

  async function markAsReceived(id: string) {
    return updateLabOrder(id, { status: "received", received_date: toLocalDateStr(new Date()) });
  }

  async function registerPayment(
    orderId: string,
    data: { amount: number; payment_date: string; payment_method: string; notes?: string }
  ) {
    if (!clinic) return { error: "No hay clínica activa" };

    // Get current order to check amounts
    const { data: order, error: fetchError } = await supabase
      .from("lab_orders")
      .select("cost, amount_paid")
      .eq("id", orderId)
      .eq("clinic_id", clinic.id)
      .single();

    if (fetchError) return { error: fetchError.message };
    if (!order) return { error: "Pedido no encontrado" };

    const currentPaid = Number(order.amount_paid) || 0;
    const totalCost = Number(order.cost) || 0;
    const remaining = totalCost - currentPaid;

    if (data.amount > remaining + 0.01) {
      return { error: `El monto excede el saldo pendiente (S/${remaining.toFixed(2)})` };
    }

    // Insert payment record
    const { error: payError } = await supabase.from("lab_payments").insert({
      clinic_id: clinic.id,
      lab_order_id: orderId,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      notes: data.notes || null,
    });

    if (payError) return { error: payError.message };

    // Update lab_order amount_paid and payment_status
    const newPaid = currentPaid + data.amount;
    const isFullyPaid = newPaid >= totalCost - 0.01;

    const { error: updateError } = await supabase
      .from("lab_orders")
      .update({
        amount_paid: newPaid,
        payment_status: isFullyPaid ? "paid" : "pending",
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", orderId)
      .eq("clinic_id", clinic.id);

    return { error: updateError?.message || null };
  }

  async function deletePayment(paymentId: string, orderId: string, paymentAmount: number) {
    if (!clinic) return { error: "No hay clínica activa" };

    // Delete the payment record
    const { error: delError } = await supabase
      .from("lab_payments")
      .delete()
      .eq("id", paymentId)
      .eq("clinic_id", clinic.id);

    if (delError) return { error: delError.message };

    // Get current order to recalculate
    const { data: order, error: fetchErr } = await supabase
      .from("lab_orders")
      .select("cost, amount_paid")
      .eq("id", orderId)
      .eq("clinic_id", clinic.id)
      .single();

    if (fetchErr) return { error: fetchErr.message };

    if (order) {
      const newPaid = Math.max(0, (Number(order.amount_paid) || 0) - paymentAmount);
      const totalCost = Number(order.cost) || 0;

      await supabase
        .from("lab_orders")
        .update({
          amount_paid: newPaid,
          payment_status: newPaid >= totalCost - 0.01 && totalCost > 0 ? "paid" : "pending",
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", orderId)
        .eq("clinic_id", clinic.id);
    }

    return { error: null };
  }

  async function deleteLabOrder(id: string) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase
      .from("lab_orders")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  return { createLabOrder, updateLabOrder, markAsPaid, markAsReceived, registerPayment, deletePayment, deleteLabOrder };
}
