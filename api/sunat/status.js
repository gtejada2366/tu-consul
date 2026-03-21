import { getClinicFromRequest, getAdminClient } from "./_lib/supabase-admin.js";
import { getStatus } from "./_lib/sunat-client.js";
import { decrypt } from "./_lib/crypto.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (checkRateLimit(req, res, { limit: 20 })) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { clinicId } = await getClinicFromRequest(req);
    const { ticket } = req.body;

    if (!ticket || typeof ticket !== "string" || !/^\d+$/.test(ticket)) {
      return res.status(400).json({ error: "Ticket inválido. Debe ser un valor numérico." });
    }

    const admin = getAdminClient();

    // Get SUNAT config
    const { data: config } = await admin
      .from("clinic_sunat_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .single();

    if (!config) return res.status(400).json({ error: "SUNAT no configurado" });

    const result = await getStatus(ticket, {
      ruc: config.ruc,
      solUser: config.sol_user,
      solPassword: decrypt(config.sol_password),
      isProduction: config.is_production,
    });

    if (result.inProcess) {
      return res.json({ status: "processing", message: "SUNAT aún está procesando" });
    }

    // Update boletas linked to this ticket
    if (result.success) {
      const status = result.observations?.length ? "accepted_with_observations" : "accepted";

      // Store CDR
      let cdrPath = null;
      if (result.cdrZip) {
        cdrPath = `${clinicId}/cdr/resumen-${ticket}-cdr.zip`;
        await admin.storage.from("sunat").upload(cdrPath, result.cdrZip, {
          contentType: "application/zip",
          upsert: true,
        });
      }

      await admin
        .from("comprobantes_electronicos")
        .update({
          sunat_status: status,
          sunat_response_code: result.code,
          sunat_description: result.description,
          cdr_path: cdrPath,
          updated_at: new Date().toISOString(),
        })
        .eq("clinic_id", clinicId)
        .eq("resumen_ticket", ticket);
    }

    return res.json({
      status: result.success ? "accepted" : "rejected",
      code: result.code,
      description: result.description,
      observations: result.observations,
    });
  } catch (error) {
    console.error("SUNAT status error:", error);
    return res.status(500).json({ error: "Error al consultar el estado en SUNAT." });
  }
}
