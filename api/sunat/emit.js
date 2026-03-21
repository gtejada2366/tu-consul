import { getClinicFromRequest, getAdminClient } from "./_lib/supabase-admin.js";
import { buildInvoiceXml } from "./_lib/xml-builder.js";
import { extractFromPfx, signXml, getHashFromSignedXml } from "./_lib/xml-signer.js";
import { sendBill } from "./_lib/sunat-client.js";
import { calcFromTotal, round2 } from "./_lib/igv.js";
import { TIPO_COMPROBANTE } from "./_lib/constants.js";
import { decrypt } from "./_lib/crypto.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (checkRateLimit(req, res, { limit: 10 })) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { clinicId } = await getClinicFromRequest(req);
    const body = req.body;

    const {
      invoice_id,
      tipo, // '01' or '03'
      cliente_tipo_doc,
      cliente_numero_doc,
      cliente_razon_social,
      cliente_direccion,
      items: rawItems, // [{ descripcion, cantidad, precio_total }]
    } = body;

    // Validate tipo comprobante
    const tiposPermitidos = ["01", "03", "07", "08"];
    if (!tipo || !tiposPermitidos.includes(tipo)) {
      return res.status(400).json({ error: "Tipo de comprobante inválido. Valores permitidos: 01, 03, 07, 08" });
    }

    if (!cliente_tipo_doc || !cliente_numero_doc || !cliente_razon_social) {
      return res.status(400).json({ error: "Faltan datos del cliente" });
    }

    // Validate documento type and format
    const tiposDocPermitidos = ["1", "4", "6", "7", "0", "-"];
    if (!tiposDocPermitidos.includes(cliente_tipo_doc)) {
      return res.status(400).json({ error: "Tipo de documento del cliente inválido" });
    }
    if (cliente_tipo_doc === "1" && !/^\d{8}$/.test(cliente_numero_doc)) {
      return res.status(400).json({ error: "DNI debe tener exactamente 8 dígitos" });
    }
    if (cliente_tipo_doc === "6" && !/^\d{11}$/.test(cliente_numero_doc)) {
      return res.status(400).json({ error: "RUC debe tener exactamente 11 dígitos" });
    }

    // Validate razon social length
    if (cliente_razon_social.length > 200) {
      return res.status(400).json({ error: "Razón social excede el máximo de 200 caracteres" });
    }

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: "Debe incluir al menos un item" });
    }
    if (rawItems.length > 100) {
      return res.status(400).json({ error: "Máximo 100 items por comprobante" });
    }

    // Validate each item
    for (let idx = 0; idx < rawItems.length; idx++) {
      const ri = rawItems[idx];
      if (!ri.descripcion || typeof ri.descripcion !== "string" || !ri.descripcion.trim()) {
        return res.status(400).json({ error: `Item ${idx + 1}: descripción es obligatoria` });
      }
      const precio = Number(ri.precio_total);
      const cantidad = Number(ri.cantidad || 1);
      if (isNaN(precio) || !isFinite(precio) || precio <= 0) {
        return res.status(400).json({ error: `Item ${idx + 1}: precio debe ser un número positivo` });
      }
      if (isNaN(cantidad) || !isFinite(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: `Item ${idx + 1}: cantidad debe ser un número positivo` });
      }
    }

    const admin = getAdminClient();

    // Get SUNAT config
    const { data: config } = await admin
      .from("clinic_sunat_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .single();

    if (!config) return res.status(400).json({ error: "Configura SUNAT en Configuración primero" });
    if (!config.is_active) return res.status(400).json({ error: "SUNAT no está activado" });
    if (!config.certificate_path) return res.status(400).json({ error: "Falta certificado digital" });

    // Download certificate
    const { data: certFile, error: certErr } = await admin.storage
      .from("sunat")
      .download(config.certificate_path);
    if (certErr || !certFile) return res.status(500).json({ error: "Error al leer el certificado digital. Verifique que esté correctamente configurado." });

    const pfxBuffer = Buffer.from(await certFile.arrayBuffer());
    const certData = extractFromPfx(pfxBuffer, decrypt(config.certificate_password) || "");

    // Get next correlativo
    const { data: corrData, error: corrErr } = await admin.rpc("next_correlativo", {
      p_clinic_id: clinicId,
      p_tipo: tipo,
    });
    if (corrErr) return res.status(500).json({ error: "Error al generar el correlativo. Intente nuevamente." });
    const correlativo = corrData;

    const serie = tipo === TIPO_COMPROBANTE.FACTURA ? config.serie_factura : config.serie_boleta;

    // Calculate IGV per item
    const items = rawItems.map((ri) => {
      const totalItem = round2(Number(ri.precio_total) * Number(ri.cantidad || 1));
      const { valorVenta, igv } = calcFromTotal(totalItem);
      const valorUnitario = round2(Number(ri.precio_total) / (1 + 0.18));
      return {
        cantidad: Number(ri.cantidad || 1),
        unidad: "ZZ",
        descripcion: ri.descripcion,
        valorUnitario,
        precioUnitario: round2(Number(ri.precio_total)),
        subtotal: valorVenta,
        igv,
        tipoAfectacion: "10",
        total: totalItem,
      };
    });

    const totalGravada = round2(items.reduce((s, i) => s + i.subtotal, 0));
    const totalIgv = round2(items.reduce((s, i) => s + i.igv, 0));
    const totalVenta = round2(items.reduce((s, i) => s + i.total, 0));

    const fechaEmision = new Date().toISOString().split("T")[0];

    const emitData = {
      ruc: config.ruc,
      razonSocial: config.razon_social,
      nombreComercial: config.nombre_comercial || undefined,
      direccion: config.direccion_fiscal || undefined,
      ubigeo: config.ubigeo || undefined,
      tipoComprobante: tipo,
      serie,
      correlativo,
      fechaEmision,
      moneda: "PEN",
      clienteTipoDoc: cliente_tipo_doc,
      clienteNumDoc: cliente_numero_doc,
      clienteRazonSocial: cliente_razon_social,
      clienteDireccion: cliente_direccion,
      totalGravada,
      totalExonerada: 0,
      totalInafecta: 0,
      totalIgv,
      totalVenta,
      items,
    };

    // Build XML
    const xml = buildInvoiceXml(emitData);

    // Sign XML
    const signedXml = signXml(xml, certData);
    const hash = getHashFromSignedXml(signedXml);

    const fileName = `${config.ruc}-${tipo}-${serie}-${String(correlativo).padStart(8, "0")}`;

    // Store signed XML in Supabase Storage
    const xmlPath = `${clinicId}/xml/${fileName}.xml`;
    await admin.storage.from("sunat").upload(xmlPath, Buffer.from(signedXml), {
      contentType: "application/xml",
      upsert: true,
    });

    // For boletas, store locally and mark as pending (need Resumen Diario)
    if (tipo === TIPO_COMPROBANTE.BOLETA) {
      const { data: comprobante, error: insertErr } = await admin
        .from("comprobantes_electronicos")
        .insert({
          clinic_id: clinicId,
          invoice_id: invoice_id || null,
          tipo_comprobante: tipo,
          serie,
          correlativo,
          fecha_emision: fechaEmision,
          cliente_tipo_doc,
          cliente_numero_doc,
          cliente_razon_social,
          cliente_direccion: cliente_direccion || null,
          total_gravada: totalGravada,
          total_igv: totalIgv,
          total_venta: totalVenta,
          sunat_status: "pending",
          xml_signed_path: xmlPath,
          hash_cpe: hash,
        })
        .select()
        .single();

      if (insertErr) return res.status(500).json({ error: "Error al guardar el comprobante. Intente nuevamente." });

      // Insert items
      await admin.from("comprobante_items").insert(
        items.map((it) => ({
          comprobante_id: comprobante.id,
          cantidad: it.cantidad,
          unidad: it.unidad,
          descripcion: it.descripcion,
          valor_unitario: it.valorUnitario,
          precio_unitario: it.precioUnitario,
          subtotal: it.subtotal,
          igv: it.igv,
          tipo_afectacion: it.tipoAfectacion,
          total: it.total,
        }))
      );

      return res.json({
        success: true,
        comprobante: {
          id: comprobante.id,
          numero: `${serie}-${String(correlativo).padStart(8, "0")}`,
          status: "pending",
          message: "Boleta generada. Envía el Resumen Diario para reportarla a SUNAT.",
        },
      });
    }

    // For facturas and notas: send directly to SUNAT
    const result = await sendBill(signedXml, fileName, {
      ruc: config.ruc,
      solUser: config.sol_user,
      solPassword: decrypt(config.sol_password),
      isProduction: config.is_production,
    });

    // Store CDR if received
    let cdrPath = null;
    if (result.cdrZip) {
      cdrPath = `${clinicId}/cdr/${fileName}-cdr.zip`;
      await admin.storage.from("sunat").upload(cdrPath, result.cdrZip, {
        contentType: "application/zip",
        upsert: true,
      });
    }

    const sunatStatus = result.success
      ? result.observations?.length
        ? "accepted_with_observations"
        : "accepted"
      : "rejected";

    const { data: comprobante, error: insertErr } = await admin
      .from("comprobantes_electronicos")
      .insert({
        clinic_id: clinicId,
        invoice_id: invoice_id || null,
        tipo_comprobante: tipo,
        serie,
        correlativo,
        fecha_emision: fechaEmision,
        cliente_tipo_doc,
        cliente_numero_doc,
        cliente_razon_social,
        cliente_direccion: cliente_direccion || null,
        total_gravada: totalGravada,
        total_igv: totalIgv,
        total_venta: totalVenta,
        sunat_status: sunatStatus,
        sunat_response_code: result.code,
        sunat_description: result.description,
        xml_signed_path: xmlPath,
        cdr_path: cdrPath,
        hash_cpe: hash,
      })
      .select()
      .single();

    if (insertErr) return res.status(500).json({ error: "Error al guardar el comprobante. Intente nuevamente." });

    // Insert items
    await admin.from("comprobante_items").insert(
      items.map((it) => ({
        comprobante_id: comprobante.id,
        cantidad: it.cantidad,
        unidad: it.unidad,
        descripcion: it.descripcion,
        valor_unitario: it.valorUnitario,
        precio_unitario: it.precioUnitario,
        subtotal: it.subtotal,
        igv: it.igv,
        tipo_afectacion: it.tipoAfectacion,
        total: it.total,
      }))
    );

    return res.json({
      success: result.success,
      comprobante: {
        id: comprobante.id,
        numero: `${serie}-${String(correlativo).padStart(8, "0")}`,
        status: sunatStatus,
        code: result.code,
        description: result.description,
        observations: result.observations,
      },
    });
  } catch (error) {
    console.error("SUNAT emit error:", error);
    return res.status(500).json({ error: "Error interno al procesar el comprobante. Intente nuevamente." });
  }
}
