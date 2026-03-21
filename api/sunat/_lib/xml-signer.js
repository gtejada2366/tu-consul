import * as forge from "node-forge";
import { SignedXml } from "xml-crypto";

/** Extract private key and certificate from PFX buffer */
export function extractFromPfx(pfxBuffer, password) {
  const asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) throw new Error("No se encontró la llave privada en el certificado .pfx");

  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error("No se encontró el certificado en el archivo .pfx");

  const certificatePem = forge.pki.certificateToPem(certBag.cert);

  // Get X509 in base64 DER format
  const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(certBag.cert)).getBytes();
  const certificateX509 = forge.util.encode64(derBytes);

  return { privateKeyPem, certificatePem, certificateX509 };
}

/** Sign a UBL XML document with XMLDSig enveloped signature */
export function signXml(xml, certData) {
  const sig = new SignedXml({
    privateKey: certData.privateKeyPem,
    publicCert: certData.certificatePem,
    canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
    signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    getKeyInfoContent: () => `<X509Data><X509Certificate>${certData.certificateX509}</X509Certificate></X509Data>`,
  });

  sig.addReference({
    xpath: "//*[local-name()='ExtensionContent']",
    transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
    digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
  });

  sig.computeSignature(xml, {
    location: { reference: "//*[local-name()='ExtensionContent']", action: "append" },
  });

  return sig.getSignedXml();
}

/** Get hash (digest) from signed XML for the comprobante representation */
export function getHashFromSignedXml(signedXml) {
  const match = signedXml.match(/<ds:DigestValue>([^<]+)<\/ds:DigestValue>/);
  if (!match) {
    const match2 = signedXml.match(/<DigestValue>([^<]+)<\/DigestValue>/);
    return match2?.[1] || "";
  }
  return match[1];
}
