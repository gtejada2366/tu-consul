// SUNAT endpoints and constants

export const SUNAT_ENDPOINTS = {
  beta: "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl",
  production: "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl",
};

export const SUNAT_STATUS_ENDPOINT = {
  beta: "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl",
  production: "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl",
};

export const IGV_RATE = 0.18;

export const TIPO_COMPROBANTE = {
  FACTURA: "01",
  BOLETA: "03",
  NOTA_CREDITO: "07",
  NOTA_DEBITO: "08",
};

export const TIPO_DOCUMENTO_IDENTIDAD = {
  SIN_DOCUMENTO: "0",
  DNI: "1",
  RUC: "6",
};

export const TIPO_AFECTACION_IGV = {
  GRAVADO: "10",
  EXONERADO: "20",
  INAFECTO: "30",
};

export const MONEDA = {
  PEN: "PEN",
  USD: "USD",
};

// UBL 2.1 namespaces
export const UBL_NAMESPACES = {
  cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  ds: "http://www.w3.org/2000/09/xmldsig#",
  ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  invoice: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  creditNote: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
  debitNote: "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2",
};
