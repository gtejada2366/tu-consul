import { create } from "xmlbuilder2";
import { UBL_NAMESPACES, TIPO_COMPROBANTE } from "./constants.js";

export function buildInvoiceXml(data) {
  const isFactura = data.tipoComprobante === TIPO_COMPROBANTE.FACTURA;
  const isBoleta = data.tipoComprobante === TIPO_COMPROBANTE.BOLETA;
  const isNotaCredito = data.tipoComprobante === TIPO_COMPROBANTE.NOTA_CREDITO;

  const numero = `${data.serie}-${String(data.correlativo).padStart(8, "0")}`;

  if (isNotaCredito) {
    return buildCreditNote(data, numero);
  }

  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele(UBL_NAMESPACES.invoice, "Invoice")
    .att("xmlns:cac", UBL_NAMESPACES.cac)
    .att("xmlns:cbc", UBL_NAMESPACES.cbc)
    .att("xmlns:ds", UBL_NAMESPACES.ds)
    .att("xmlns:ext", UBL_NAMESPACES.ext);

  // UBL Extensions placeholder for signature
  root
    .ele(UBL_NAMESPACES.ext, "UBLExtensions")
    .ele(UBL_NAMESPACES.ext, "UBLExtension")
    .ele(UBL_NAMESPACES.ext, "ExtensionContent");

  // UBL version
  root.ele(UBL_NAMESPACES.cbc, "UBLVersionID").txt("2.1");
  root.ele(UBL_NAMESPACES.cbc, "CustomizationID").txt("2.0");

  // Document ID
  root.ele(UBL_NAMESPACES.cbc, "ID").txt(numero);
  root.ele(UBL_NAMESPACES.cbc, "IssueDate").txt(data.fechaEmision);
  root.ele(UBL_NAMESPACES.cbc, "IssueTime").txt("00:00:00");

  // Document type
  root
    .ele(UBL_NAMESPACES.cbc, "InvoiceTypeCode")
    .att("listID", "0101") // Catalog 51: venta interna
    .txt(data.tipoComprobante);

  // Currency
  root
    .ele(UBL_NAMESPACES.cbc, "DocumentCurrencyCode")
    .att("listID", "ISO 4217 Alpha")
    .txt(data.moneda);

  // Signature reference
  addSignatureRef(root, data.ruc);

  // Emisor (Supplier)
  addSupplier(root, data);

  // Cliente (Customer)
  addCustomer(root, data, isFactura);

  // Tax totals
  addTaxTotals(root, data);

  // Monetary totals
  const monetary = root.ele(UBL_NAMESPACES.cac, "LegalMonetaryTotal");
  monetary.ele(UBL_NAMESPACES.cbc, "LineExtensionAmount").att("currencyID", data.moneda).txt(data.totalGravada.toFixed(2));
  monetary.ele(UBL_NAMESPACES.cbc, "TaxInclusiveAmount").att("currencyID", data.moneda).txt(data.totalVenta.toFixed(2));
  monetary.ele(UBL_NAMESPACES.cbc, "PayableAmount").att("currencyID", data.moneda).txt(data.totalVenta.toFixed(2));

  // Line items
  data.items.forEach((item, i) => {
    addInvoiceLine(root, item, i + 1, data.moneda);
  });

  return root.end({ prettyPrint: true });
}

function buildCreditNote(data, numero) {
  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele(UBL_NAMESPACES.creditNote, "CreditNote")
    .att("xmlns:cac", UBL_NAMESPACES.cac)
    .att("xmlns:cbc", UBL_NAMESPACES.cbc)
    .att("xmlns:ds", UBL_NAMESPACES.ds)
    .att("xmlns:ext", UBL_NAMESPACES.ext);

  root
    .ele(UBL_NAMESPACES.ext, "UBLExtensions")
    .ele(UBL_NAMESPACES.ext, "UBLExtension")
    .ele(UBL_NAMESPACES.ext, "ExtensionContent");

  root.ele(UBL_NAMESPACES.cbc, "UBLVersionID").txt("2.1");
  root.ele(UBL_NAMESPACES.cbc, "CustomizationID").txt("2.0");
  root.ele(UBL_NAMESPACES.cbc, "ID").txt(numero);
  root.ele(UBL_NAMESPACES.cbc, "IssueDate").txt(data.fechaEmision);
  root.ele(UBL_NAMESPACES.cbc, "IssueTime").txt("00:00:00");
  root.ele(UBL_NAMESPACES.cbc, "DocumentCurrencyCode").att("listID", "ISO 4217 Alpha").txt(data.moneda);

  // Discrepancy response
  const disc = root.ele(UBL_NAMESPACES.cac, "DiscrepancyResponse");
  const refNumero = `${data.docReferenciaSerie}-${String(data.docReferenciaCorrelativo || 0).padStart(8, "0")}`;
  disc.ele(UBL_NAMESPACES.cbc, "ReferenceID").txt(refNumero);
  disc.ele(UBL_NAMESPACES.cbc, "ResponseCode").txt(data.codigoMotivoNota || "01");
  disc.ele(UBL_NAMESPACES.cbc, "Description").txt(data.motivoNota || "Anulación de comprobante");

  // Billing reference
  const billingRef = root.ele(UBL_NAMESPACES.cac, "BillingReference").ele(UBL_NAMESPACES.cac, "InvoiceDocumentReference");
  billingRef.ele(UBL_NAMESPACES.cbc, "ID").txt(refNumero);
  billingRef.ele(UBL_NAMESPACES.cbc, "DocumentTypeCode").txt(data.docReferenciaTipo || "01");

  addSignatureRef(root, data.ruc);
  addSupplier(root, data);
  addCustomer(root, data, data.docReferenciaTipo === "01");
  addTaxTotals(root, data);

  const monetary = root.ele(UBL_NAMESPACES.cac, "LegalMonetaryTotal");
  monetary.ele(UBL_NAMESPACES.cbc, "LineExtensionAmount").att("currencyID", data.moneda).txt(data.totalGravada.toFixed(2));
  monetary.ele(UBL_NAMESPACES.cbc, "TaxInclusiveAmount").att("currencyID", data.moneda).txt(data.totalVenta.toFixed(2));
  monetary.ele(UBL_NAMESPACES.cbc, "PayableAmount").att("currencyID", data.moneda).txt(data.totalVenta.toFixed(2));

  data.items.forEach((item, i) => {
    addCreditNoteLine(root, item, i + 1, data.moneda);
  });

  return root.end({ prettyPrint: true });
}

function addSignatureRef(root, ruc) {
  const sig = root.ele(UBL_NAMESPACES.cac, "Signature");
  sig.ele(UBL_NAMESPACES.cbc, "ID").txt("IDSignKG");
  const party = sig.ele(UBL_NAMESPACES.cac, "SignatoryParty");
  party.ele(UBL_NAMESPACES.cac, "PartyIdentification").ele(UBL_NAMESPACES.cbc, "ID").txt(ruc);
  party.ele(UBL_NAMESPACES.cac, "PartyName").ele(UBL_NAMESPACES.cbc, "Name").txt(ruc);
  sig.ele(UBL_NAMESPACES.cac, "DigitalSignatureAttachment")
    .ele(UBL_NAMESPACES.cac, "ExternalReference")
    .ele(UBL_NAMESPACES.cbc, "URI").txt("#SignatureKG");
}

function addSupplier(root, data) {
  const supplier = root.ele(UBL_NAMESPACES.cac, "AccountingSupplierParty");
  const party = supplier.ele(UBL_NAMESPACES.cac, "Party");

  // Party identification
  party
    .ele(UBL_NAMESPACES.cac, "PartyIdentification")
    .ele(UBL_NAMESPACES.cbc, "ID")
    .att("schemeID", "6") // RUC
    .txt(data.ruc);

  // Party name
  party
    .ele(UBL_NAMESPACES.cac, "PartyName")
    .ele(UBL_NAMESPACES.cbc, "Name")
    .txt(data.nombreComercial || data.razonSocial);

  // Legal entity
  const legal = party.ele(UBL_NAMESPACES.cac, "PartyLegalEntity");
  legal.ele(UBL_NAMESPACES.cbc, "RegistrationName").txt(data.razonSocial);
  if (data.direccion) {
    const addr = legal.ele(UBL_NAMESPACES.cac, "RegistrationAddress");
    if (data.ubigeo) addr.ele(UBL_NAMESPACES.cbc, "ID").txt(data.ubigeo);
    addr.ele(UBL_NAMESPACES.cac, "AddressLine").ele(UBL_NAMESPACES.cbc, "Line").txt(data.direccion);
    addr.ele(UBL_NAMESPACES.cac, "Country").ele(UBL_NAMESPACES.cbc, "IdentificationCode").txt("PE");
  }
}

function addCustomer(root, data, requireAddress) {
  const customer = root.ele(UBL_NAMESPACES.cac, "AccountingCustomerParty");
  const party = customer.ele(UBL_NAMESPACES.cac, "Party");

  party
    .ele(UBL_NAMESPACES.cac, "PartyIdentification")
    .ele(UBL_NAMESPACES.cbc, "ID")
    .att("schemeID", data.clienteTipoDoc)
    .txt(data.clienteNumDoc);

  const legal = party.ele(UBL_NAMESPACES.cac, "PartyLegalEntity");
  legal.ele(UBL_NAMESPACES.cbc, "RegistrationName").txt(data.clienteRazonSocial);

  if (requireAddress && data.clienteDireccion) {
    legal
      .ele(UBL_NAMESPACES.cac, "RegistrationAddress")
      .ele(UBL_NAMESPACES.cac, "AddressLine")
      .ele(UBL_NAMESPACES.cbc, "Line")
      .txt(data.clienteDireccion);
  }
}

function addTaxTotals(root, data) {
  const tax = root.ele(UBL_NAMESPACES.cac, "TaxTotal");
  tax.ele(UBL_NAMESPACES.cbc, "TaxAmount").att("currencyID", data.moneda).txt(data.totalIgv.toFixed(2));

  if (data.totalGravada > 0) {
    const sub = tax.ele(UBL_NAMESPACES.cac, "TaxSubtotal");
    sub.ele(UBL_NAMESPACES.cbc, "TaxableAmount").att("currencyID", data.moneda).txt(data.totalGravada.toFixed(2));
    sub.ele(UBL_NAMESPACES.cbc, "TaxAmount").att("currencyID", data.moneda).txt(data.totalIgv.toFixed(2));
    const cat = sub.ele(UBL_NAMESPACES.cac, "TaxCategory");
    cat.ele(UBL_NAMESPACES.cbc, "ID").txt("S");
    cat.ele(UBL_NAMESPACES.cbc, "Percent").txt("18.00");
    const scheme = cat.ele(UBL_NAMESPACES.cac, "TaxScheme");
    scheme.ele(UBL_NAMESPACES.cbc, "ID").txt("1000");
    scheme.ele(UBL_NAMESPACES.cbc, "Name").txt("IGV");
    scheme.ele(UBL_NAMESPACES.cbc, "TaxTypeCode").txt("VAT");
  }
}

function addInvoiceLine(root, item, lineId, currency) {
  const line = root.ele(UBL_NAMESPACES.cac, "InvoiceLine");
  line.ele(UBL_NAMESPACES.cbc, "ID").txt(String(lineId));
  line.ele(UBL_NAMESPACES.cbc, "InvoicedQuantity").att("unitCode", item.unidad).txt(item.cantidad.toString());
  line.ele(UBL_NAMESPACES.cbc, "LineExtensionAmount").att("currencyID", currency).txt(item.subtotal.toFixed(2));

  // Pricing reference
  const pricing = line.ele(UBL_NAMESPACES.cac, "PricingReference");
  const altPrice = pricing.ele(UBL_NAMESPACES.cac, "AlternativeConditionPrice");
  altPrice.ele(UBL_NAMESPACES.cbc, "PriceAmount").att("currencyID", currency).txt(item.precioUnitario.toFixed(2));
  altPrice.ele(UBL_NAMESPACES.cbc, "PriceTypeCode").txt("01"); // Precio unitario con IGV

  // Tax total per line
  const taxTotal = line.ele(UBL_NAMESPACES.cac, "TaxTotal");
  taxTotal.ele(UBL_NAMESPACES.cbc, "TaxAmount").att("currencyID", currency).txt(item.igv.toFixed(2));

  const sub = taxTotal.ele(UBL_NAMESPACES.cac, "TaxSubtotal");
  sub.ele(UBL_NAMESPACES.cbc, "TaxableAmount").att("currencyID", currency).txt(item.subtotal.toFixed(2));
  sub.ele(UBL_NAMESPACES.cbc, "TaxAmount").att("currencyID", currency).txt(item.igv.toFixed(2));
  const cat = sub.ele(UBL_NAMESPACES.cac, "TaxCategory");
  cat.ele(UBL_NAMESPACES.cbc, "ID").txt("S");
  cat.ele(UBL_NAMESPACES.cbc, "Percent").txt("18.00");
  cat.ele(UBL_NAMESPACES.cbc, "TaxExemptionReasonCode").txt(item.tipoAfectacion);
  const scheme = cat.ele(UBL_NAMESPACES.cac, "TaxScheme");
  scheme.ele(UBL_NAMESPACES.cbc, "ID").txt("1000");
  scheme.ele(UBL_NAMESPACES.cbc, "Name").txt("IGV");
  scheme.ele(UBL_NAMESPACES.cbc, "TaxTypeCode").txt("VAT");

  // Item description
  const itemEl = line.ele(UBL_NAMESPACES.cac, "Item");
  itemEl.ele(UBL_NAMESPACES.cbc, "Description").txt(item.descripcion);

  // Price
  line.ele(UBL_NAMESPACES.cac, "Price")
    .ele(UBL_NAMESPACES.cbc, "PriceAmount")
    .att("currencyID", currency)
    .txt(item.valorUnitario.toFixed(2));
}

function addCreditNoteLine(root, item, lineId, currency) {
  const line = root.ele(UBL_NAMESPACES.cac, "CreditNoteLine");
  line.ele(UBL_NAMESPACES.cbc, "ID").txt(String(lineId));
  line.ele(UBL_NAMESPACES.cbc, "CreditedQuantity").att("unitCode", item.unidad).txt(item.cantidad.toString());
  line.ele(UBL_NAMESPACES.cbc, "LineExtensionAmount").att("currencyID", currency).txt(item.subtotal.toFixed(2));

  const pricing = line.ele(UBL_NAMESPACES.cac, "PricingReference");
  const altPrice = pricing.ele(UBL_NAMESPACES.cac, "AlternativeConditionPrice");
  altPrice.ele(UBL_NAMESPACES.cbc, "PriceAmount").att("currencyID", currency).txt(item.precioUnitario.toFixed(2));
  altPrice.ele(UBL_NAMESPACES.cbc, "PriceTypeCode").txt("01");

  const taxTotal = line.ele(UBL_NAMESPACES.cac, "TaxTotal");
  taxTotal.ele(UBL_NAMESPACES.cbc, "TaxAmount").att("currencyID", currency).txt(item.igv.toFixed(2));
  const sub = taxTotal.ele(UBL_NAMESPACES.cac, "TaxSubtotal");
  sub.ele(UBL_NAMESPACES.cbc, "TaxableAmount").att("currencyID", currency).txt(item.subtotal.toFixed(2));
  sub.ele(UBL_NAMESPACES.cbc, "TaxAmount").att("currencyID", currency).txt(item.igv.toFixed(2));
  const cat = sub.ele(UBL_NAMESPACES.cac, "TaxCategory");
  cat.ele(UBL_NAMESPACES.cbc, "ID").txt("S");
  cat.ele(UBL_NAMESPACES.cbc, "Percent").txt("18.00");
  cat.ele(UBL_NAMESPACES.cbc, "TaxExemptionReasonCode").txt(item.tipoAfectacion);
  const scheme = cat.ele(UBL_NAMESPACES.cac, "TaxScheme");
  scheme.ele(UBL_NAMESPACES.cbc, "ID").txt("1000");
  scheme.ele(UBL_NAMESPACES.cbc, "Name").txt("IGV");
  scheme.ele(UBL_NAMESPACES.cbc, "TaxTypeCode").txt("VAT");

  const itemEl = line.ele(UBL_NAMESPACES.cac, "Item");
  itemEl.ele(UBL_NAMESPACES.cbc, "Description").txt(item.descripcion);

  line.ele(UBL_NAMESPACES.cac, "Price")
    .ele(UBL_NAMESPACES.cbc, "PriceAmount")
    .att("currencyID", currency)
    .txt(item.valorUnitario.toFixed(2));
}
