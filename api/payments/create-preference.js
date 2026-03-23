import { getClinicFromRequest, getAdminClient } from "../sunat/_lib/supabase-admin.js";
import { getPreferenceAPI, PLAN_PRICES } from "./_lib/mercadopago.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { clinicId, role } = await getClinicFromRequest(req);

    if (role !== "admin") {
      return res.status(403).json({ error: "Solo administradores pueden gestionar suscripciones" });
    }

    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({ error: "Plan inválido. Valores: basic, premium" });
    }

    const price = PLAN_PRICES[plan];
    const planLabel = plan === "basic" ? "Básico" : "Premium";

    // Get clinic info for the preference
    const admin = getAdminClient();
    const { data: clinic } = await admin
      .from("clinics")
      .select("name, email")
      .eq("id", clinicId)
      .single();

    // Calculate period
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Create subscription transaction (pending)
    const { data: tx, error: txError } = await admin
      .from("subscription_transactions")
      .insert({
        clinic_id: clinicId,
        plan,
        amount: price,
        currency: "PEN",
        status: "pending",
        period_start: now.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (txError) throw txError;

    // Build the base URL from the request
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const baseUrl = `${proto}://${host}`;

    // Create Mercado Pago preference
    const preferenceAPI = getPreferenceAPI();
    const preference = await preferenceAPI.create({
      body: {
        items: [
          {
            id: `tuconsul-${plan}-${tx.id}`,
            title: `Tu Consul — Plan ${planLabel} (1 mes)`,
            description: `Suscripción mensual al plan ${planLabel}`,
            quantity: 1,
            unit_price: price,
            currency_id: "PEN",
          },
        ],
        payer: {
          email: clinic?.email || undefined,
        },
        back_urls: {
          success: `${baseUrl}/settings?payment=success&tx=${tx.id}`,
          failure: `${baseUrl}/settings?payment=failure&tx=${tx.id}`,
          pending: `${baseUrl}/settings?payment=pending&tx=${tx.id}`,
        },
        auto_return: "approved",
        external_reference: tx.id,
        notification_url: `${baseUrl}/api/payments/webhook`,
        statement_descriptor: "TUCONSUL",
      },
    });

    // Update transaction with preference ID
    await admin
      .from("subscription_transactions")
      .update({ mp_preference_id: preference.id })
      .eq("id", tx.id);

    return res.status(200).json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      transaction_id: tx.id,
    });
  } catch (err) {
    console.error("create-preference error:", err);
    return res.status(500).json({ error: err.message || "Error interno" });
  }
}
