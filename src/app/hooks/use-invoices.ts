import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { InvoiceWithPatient, InvoicePayment } from "../lib/types";
import { toLocalDateStr } from "../lib/constants";

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

    if (error) {
      console.error("Error fetching invoices:", error.message);
    } else if (data) {
      setInvoices(data as unknown as InvoiceWithPatient[]);
    }
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalRevenue = invoices
    .reduce((sum, i) => sum + (i.amount_paid || 0), 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.amount - (i.amount_paid || 0)), 0);

  const collectionRate = invoices.length > 0
    ? Math.round((invoices.filter((i) => i.status === "paid").length / invoices.length) * 100)
    : 0;

  return { invoices, loading, totalRevenue, pendingRevenue, collectionRate, refetch: fetchInvoices };
}

export function useInvoicePayments(invoiceId: string | null) {
  const { clinic } = useAuth();
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!clinic || !invoiceId) {
      setPayments([]);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("clinic_id", clinic.id)
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setPayments(data as InvoicePayment[]);
    }
    setLoading(false);
  }, [clinic, invoiceId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, refetchPayments: fetchPayments };
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
      date: toLocalDateStr(new Date()),
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

  async function registerPayment(id: string, amountPaid: number, paymentMethod: string) {
    if (!clinic) return { error: "No hay clínica activa" };

    // Get current invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("amount, amount_paid")
      .eq("id", id)
      .eq("clinic_id", clinic.id)
      .single();

    if (!invoice) return { error: "Factura no encontrada" };

    const currentPaid = Number(invoice.amount_paid) || 0;
    const totalAmount = Number(invoice.amount);
    const remaining = totalAmount - currentPaid;

    if (amountPaid > remaining + 0.01) {
      return { error: `El monto excede el saldo pendiente (S/${remaining.toFixed(2)})` };
    }

    // Insert payment record
    const { error: payError } = await supabase.from("invoice_payments").insert({
      clinic_id: clinic.id,
      invoice_id: id,
      amount: amountPaid,
      payment_date: toLocalDateStr(new Date()),
      payment_method: paymentMethod,
    });

    if (payError) return { error: payError.message };

    // Update invoice totals
    const newPaid = currentPaid + amountPaid;
    const isFullyPaid = newPaid >= totalAmount - 0.01;

    const { error } = await supabase
      .from("invoices")
      .update({
        amount_paid: newPaid,
        status: isFullyPaid ? "paid" : "pending",
        payment_method: paymentMethod,
        paid_at: isFullyPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", id)
      .eq("clinic_id", clinic.id);

    return { error: error?.message || null };
  }

  async function deletePayment(paymentId: string, invoiceId: string, paymentAmount: number) {
    if (!clinic) return { error: "No hay clínica activa" };

    // Delete the payment record
    const { error: delError } = await supabase
      .from("invoice_payments")
      .delete()
      .eq("id", paymentId)
      .eq("clinic_id", clinic.id);

    if (delError) return { error: delError.message };

    // Get current invoice to recalculate
    const { data: invoice, error: fetchErr } = await supabase
      .from("invoices")
      .select("amount, amount_paid")
      .eq("id", invoiceId)
      .eq("clinic_id", clinic.id)
      .single();

    if (fetchErr) return { error: fetchErr.message };

    if (invoice) {
      const newPaid = Math.max(0, (Number(invoice.amount_paid) || 0) - paymentAmount);
      const totalAmount = Number(invoice.amount) || 0;

      await supabase
        .from("invoices")
        .update({
          amount_paid: newPaid,
          payment_status: newPaid >= totalAmount - 0.01 && totalAmount > 0 ? "paid" : "pending",
          status: newPaid >= totalAmount - 0.01 && totalAmount > 0 ? "paid" : "pending",
          paid_at: newPaid >= totalAmount - 0.01 && totalAmount > 0 ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", invoiceId)
        .eq("clinic_id", clinic.id);
    }

    return { error: null };
  }

  return { createInvoice, markAsPaid, registerPayment, deletePayment };
}
