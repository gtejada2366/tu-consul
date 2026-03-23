import { getAdminClient } from "../sunat/_lib/supabase-admin.js";
import { getPaymentAPI } from "./_lib/mercadopago.js";

export default async function handler(req, res) {
  // Mercado Pago sends both GET (for verification) and POST (for notifications)
  if (req.method === "GET") return res.status(200).send("OK");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { type, data } = req.body;

    // We only care about payment notifications
    if (type !== "payment") {
      return res.status(200).json({ received: true, ignored: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(200).json({ received: true, no_id: true });
    }

    // Fetch payment details from Mercado Pago
    const paymentAPI = getPaymentAPI();
    const payment = await paymentAPI.get({ id: paymentId });

    const externalRef = payment.external_reference; // our transaction ID
    if (!externalRef) {
      console.warn("Webhook: payment without external_reference", paymentId);
      return res.status(200).json({ received: true });
    }

    const admin = getAdminClient();

    // Map MP status to our status
    const statusMap = {
      approved: "approved",
      rejected: "rejected",
      refunded: "refunded",
      in_process: "pending",
      pending: "pending",
    };

    const ourStatus = statusMap[payment.status] || "pending";

    // Update the transaction
    await admin
      .from("subscription_transactions")
      .update({
        mp_payment_id: String(paymentId),
        status: ourStatus,
        payer_email: payment.payer?.email || null,
        mp_status_detail: payment.status_detail || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", externalRef);

    // If approved, upgrade the clinic's plan
    if (ourStatus === "approved") {
      const { data: tx } = await admin
        .from("subscription_transactions")
        .select("clinic_id, plan, period_end")
        .eq("id", externalRef)
        .single();

      if (tx) {
        await admin
          .from("clinics")
          .update({
            plan: tx.plan,
            plan_expires_at: tx.period_end
              ? new Date(tx.period_end + "T23:59:59Z").toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tx.clinic_id);
      }
    }

    return res.status(200).json({ received: true, status: ourStatus });
  } catch (err) {
    console.error("webhook error:", err);
    // Always return 200 to Mercado Pago so it doesn't retry
    return res.status(200).json({ received: true, error: true });
  }
}
