import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { InvoiceWithPatient } from "../lib/types";

export function useInvoices() {
  const { clinic } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select("*, patient:patients(full_name)")
      .eq("clinic_id", clinic.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setInvoices(data as unknown as InvoiceWithPatient[]);
    }
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  const collectionRate = invoices.length > 0
    ? Math.round((invoices.filter((i) => i.status === "paid").length / invoices.length) * 100)
    : 0;

  return { invoices, loading, totalRevenue, pendingRevenue, collectionRate, refetch: fetchInvoices };
}

export function useInvoiceMutations() {
  const { clinic } = useAuth();

  async function createInvoice(data: {
    patient_id: string;
    appointment_id?: string;
    amount: number;
    service: string;
    notes?: string;
  }) {
    if (!clinic) return { error: "No hay clínica activa" };

    const { error } = await supabase.from("invoices").insert({
      clinic_id: clinic.id,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id || null,
      invoice_number: "",
      date: new Date().toISOString().split("T")[0],
      amount: data.amount,
      service: data.service,
      status: "pending",
      payment_method: null,
      paid_at: null,
      notes: data.notes || null,
    } as Record<string, unknown>);

    return { error: error?.message || null };
  }

  async function markAsPaid(id: string, paymentMethod: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  return { createInvoice, markAsPaid };
}
