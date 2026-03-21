import { getClinicFromRequest, getAdminClient } from "./_lib/supabase-admin.js";
import { extractFromPfx } from "./_lib/xml-signer.js";
import { encrypt } from "./_lib/crypto.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { IncomingForm } from "formidable";
import { readFile } from "fs/promises";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (checkRateLimit(req, res, { limit: 10 })) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { clinicId, role } = await getClinicFromRequest(req);
    if (role !== "admin") return res.status(403).json({ error: "Solo admin" });

    // Parse multipart form
    const form = new IncomingForm({ maxFileSize: 5 * 1024 * 1024 });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = Array.isArray(files.certificate) ? files.certificate[0] : files.certificate;
    if (!file) return res.status(400).json({ error: "No se recibió archivo" });

    // Validate file type by extension
    const originalName = file.originalFilename || file.newFilename || "";
    if (!originalName.toLowerCase().endsWith(".pfx") && !originalName.toLowerCase().endsWith(".p12")) {
      return res.status(400).json({ error: "Solo se aceptan archivos .pfx o .p12" });
    }

    const password = Array.isArray(fields.password) ? fields.password[0] : fields.password || "";

    // Read file asynchronously
    const pfxBuffer = await readFile(file.filepath);

    // Validate PFX structure and password
    try {
      extractFromPfx(Buffer.from(pfxBuffer), password);
    } catch (e) {
      return res.status(400).json({
        error: "Certificado inválido. Verifica que el archivo .pfx y la contraseña sean correctos.",
      });
    }

    const admin = getAdminClient();

    // Upload to Supabase Storage
    const storagePath = `${clinicId}/certificate.pfx`;
    const { error: uploadErr } = await admin.storage.from("sunat").upload(storagePath, pfxBuffer, {
      contentType: "application/x-pkcs12",
      upsert: true,
    });

    if (uploadErr) return res.status(500).json({ error: "Error al subir el certificado. Intente nuevamente." });

    // Update config
    const { error: updateErr } = await admin
      .from("clinic_sunat_config")
      .update({
        certificate_path: storagePath,
        certificate_password: encrypt(password),
        updated_at: new Date().toISOString(),
      })
      .eq("clinic_id", clinicId);

    if (updateErr) return res.status(500).json({ error: "Error al guardar la configuración del certificado." });

    return res.json({ success: true, message: "Certificado validado y guardado" });
  } catch (error) {
    console.error("Certificate upload error:", error);
    return res.status(500).json({ error: "Error interno al procesar el certificado." });
  }
}
