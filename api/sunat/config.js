import { getClinicFromRequest, getAdminClient } from "./_lib/supabase-admin.js";
import { encrypt } from "./_lib/crypto.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

export default async function handler(req, res) {
  if (checkRateLimit(req, res, { limit: 20 })) return;
  try {
    const { clinicId, role } = await getClinicFromRequest(req);
    if (role !== "admin") return res.status(403).json({ error: "Solo admin puede configurar SUNAT" });

    const admin = getAdminClient();

    if (req.method === "GET") {
      const { data } = await admin
        .from("clinic_sunat_config")
        .select("*")
        .eq("clinic_id", clinicId)
        .single();

      if (!data) return res.json({ config: null });

      return res.json({
        config: {
          ...data,
          sol_password: data.sol_password ? "••••••" : "",
          certificate_password: data.certificate_password ? "••••••" : "",
        },
      });
    }

    if (req.method === "PUT") {
      const body = req.body;
      // Validate RUC format if provided
      if (body.ruc && !/^\d{11}$/.test(body.ruc)) {
        return res.status(400).json({ error: "RUC debe tener exactamente 11 dígitos" });
      }

      // Validate serie formats if provided
      const serieFields = ["serie_boleta", "serie_factura", "serie_nota_credito_b", "serie_nota_credito_f"];
      for (const sf of serieFields) {
        if (body[sf] && !/^[A-Z0-9]{4}$/.test(body[sf])) {
          return res.status(400).json({ error: `Serie ${sf.replace("serie_", "")} debe tener 4 caracteres alfanuméricos` });
        }
      }

      const updateData = {
        clinic_id: clinicId,
        updated_at: new Date().toISOString(),
      };

      const fields = [
        "ruc", "razon_social", "nombre_comercial", "direccion_fiscal", "ubigeo",
        "sol_user", "serie_boleta", "serie_factura", "serie_nota_credito_b",
        "serie_nota_credito_f", "is_production", "is_active",
      ];

      for (const field of fields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }

      // Only update passwords if a real value is sent (not the masked placeholder)
      // Passwords are encrypted at rest with AES-256-GCM
      const MASK = "••••••";
      if (body.sol_password && body.sol_password !== MASK && body.sol_password.trim().length > 0) {
        updateData.sol_password = encrypt(body.sol_password);
      }
      if (body.certificate_password && body.certificate_password !== MASK && body.certificate_password.trim().length > 0) {
        updateData.certificate_password = encrypt(body.certificate_password);
      }

      const { data: existing } = await admin
        .from("clinic_sunat_config")
        .select("id")
        .eq("clinic_id", clinicId)
        .single();

      if (existing) {
        const { error } = await admin
          .from("clinic_sunat_config")
          .update(updateData)
          .eq("clinic_id", clinicId);
        if (error) return res.status(500).json({ error: "Error al actualizar la configuración SUNAT." });
      } else {
        if (!body.ruc || !body.razon_social || !body.sol_user || !body.sol_password) {
          return res.status(400).json({ error: "RUC, Razón Social, Usuario SOL y Contraseña SOL son obligatorios" });
        }
        const { error } = await admin
          .from("clinic_sunat_config")
          .insert(updateData);
        if (error) return res.status(500).json({ error: "Error al crear la configuración SUNAT." });
      }

      return res.json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("SUNAT config error:", error);
    return res.status(500).json({ error: "Error interno en la configuración SUNAT." });
  }
}
