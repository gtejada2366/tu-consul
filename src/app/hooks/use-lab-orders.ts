import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { LabOrderWithRelations } from "../lib/types";
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
    .reduce((sum, o) => sum + (o.cost || 0), 0);
  const pendingCount = orders.filter((o) => o.payment_status === "pending").length;

  return { orders, loading, totalCost, pendingPayment, pendingCount, refetch: fetchOrders };
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

  async function deleteLabOrder(id: string) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase
      .from("lab_orders")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  return { createLabOrder, updateLabOrder, markAsPaid, markAsReceived, deleteLabOrder };
}
