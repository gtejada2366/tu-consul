import * as soap from "soap";
import JSZip from "jszip";
import { SUNAT_ENDPOINTS } from "./constants.js";

/** Send a single document (Factura or Nota de Credito) to SUNAT */
export async function sendBill(signedXml, fileName, credentials) {
  // Create ZIP with the signed XML
  const zip = new JSZip();
  zip.file(`${fileName}.xml`, signedXml);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const zipBase64 = zipBuffer.toString("base64");

  const endpoint = credentials.isProduction
    ? SUNAT_ENDPOINTS.production
    : SUNAT_ENDPOINTS.beta;

  try {
    const client = await soap.createClientAsync(endpoint);

    // Set WS-Security credentials
    const security = new soap.BasicAuthSecurity(
      `${credentials.ruc}${credentials.solUser}`,
      credentials.solPassword
    );
    client.setSecurity(security);

    const [result] = await client.sendBillAsync({
      fileName: `${fileName}.zip`,
      contentFile: zipBase64,
    });

    // Parse CDR response
    if (result?.applicationResponse) {
      const cdrZipBuffer = Buffer.from(result.applicationResponse, "base64");
      return parseCdr(cdrZipBuffer);
    }

    return { success: false, code: "9999", description: "Sin respuesta de SUNAT" };
  } catch (error) {
    // SUNAT returns SOAP faults for rejections
    if (error?.root?.Envelope?.Body?.Fault) {
      const fault = error.root.Envelope.Body.Fault;
      const faultCode = fault.faultcode || "";
      const faultString = fault.faultstring || "Error desconocido de SUNAT";
      return { success: false, code: faultCode, description: faultString };
    }
    throw error;
  }
}

/** Send Resumen Diario (batch of boletas) — returns a ticket for async polling */
export async function sendSummary(signedXml, fileName, credentials) {
  const zip = new JSZip();
  zip.file(`${fileName}.xml`, signedXml);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const zipBase64 = zipBuffer.toString("base64");

  const endpoint = credentials.isProduction
    ? SUNAT_ENDPOINTS.production
    : SUNAT_ENDPOINTS.beta;

  try {
    const client = await soap.createClientAsync(endpoint);
    const security = new soap.BasicAuthSecurity(
      `${credentials.ruc}${credentials.solUser}`,
      credentials.solPassword
    );
    client.setSecurity(security);

    const [result] = await client.sendSummaryAsync({
      fileName: `${fileName}.zip`,
      contentFile: zipBase64,
    });

    if (result?.ticket) {
      return { ticket: result.ticket };
    }
    return { error: "No se recibió ticket de SUNAT" };
  } catch (error) {
    if (error?.root?.Envelope?.Body?.Fault) {
      return { error: error.root.Envelope.Body.Fault.faultstring || "Error SUNAT" };
    }
    throw error;
  }
}

/** Check ticket status (for Resumen Diario) */
export async function getStatus(ticket, credentials) {
  const endpoint = credentials.isProduction
    ? SUNAT_ENDPOINTS.production
    : SUNAT_ENDPOINTS.beta;

  const client = await soap.createClientAsync(endpoint);
  const security = new soap.BasicAuthSecurity(
    `${credentials.ruc}${credentials.solUser}`,
    credentials.solPassword
  );
  client.setSecurity(security);

  const [result] = await client.getStatusAsync({ ticket });

  if (result?.status?.content) {
    const cdrZipBuffer = Buffer.from(result.status.content, "base64");
    return parseCdr(cdrZipBuffer);
  }

  // Status code 98 = still processing
  if (result?.status?.statusCode === "98") {
    return { success: false, code: "98", description: "En proceso", inProcess: true };
  }

  return {
    success: false,
    code: result?.status?.statusCode || "9999",
    description: "Estado desconocido",
  };
}

/** Parse CDR (Constancia de Recepcion) ZIP response */
async function parseCdr(cdrZipBuffer) {
  const zip = await JSZip.loadAsync(cdrZipBuffer);
  const xmlFiles = Object.keys(zip.files).filter((f) => f.endsWith(".xml"));

  if (xmlFiles.length === 0) {
    return { success: false, code: "9999", description: "CDR sin XML", cdrZip: cdrZipBuffer };
  }

  const cdrXml = await zip.files[xmlFiles[0]].async("text");

  // Extract response code
  const codeMatch = cdrXml.match(/<cbc:ResponseCode>(\d+)<\/cbc:ResponseCode>/);
  const descMatch = cdrXml.match(/<cbc:Description>([^<]+)<\/cbc:Description>/);
  const code = codeMatch?.[1] || "9999";
  const description = descMatch?.[1] || "Sin descripción";

  // Extract observations
  const observations = [];
  const obsRegex = /<cbc:Note>([^<]+)<\/cbc:Note>/g;
  let obsMatch;
  while ((obsMatch = obsRegex.exec(cdrXml)) !== null) {
    observations.push(obsMatch[1]);
  }

  const success = code === "0" || (parseInt(code) >= 100 && parseInt(code) <= 1999);

  return {
    success,
    code,
    description,
    cdrZip: cdrZipBuffer,
    observations: observations.length > 0 ? observations : undefined,
  };
}
