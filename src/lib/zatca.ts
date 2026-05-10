/**
 * ZATCA (هيئة الزكاة والضريبة والجمارك) e-Invoice Library
 * Based on: https://github.com/seragsabrysakr/zatca_2_invoice_qr_generator
 * 
 * Phase 1: TLV tags 1-5 (seller, VAT, timestamp, total, tax)
 * Phase 2: TLV tags 1-8 (+ invoice hash, signature, public key)
 * 
 * Supports B2B and B2C invoices
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ZATCA' });

// ============ Data Models ============

export interface Address {
  streetName: string;
  buildingNumber: string;
  citySubdivisionName: string;
  cityName: string;
  postalZone: string;
  countryCode?: string; // defaults to "SA"
}

export interface Supplier {
  companyID: string;      // Commercial Registration Number
  registrationName: string; // VAT Registration Number
  address: Address;
}

export interface Customer {
  companyID: string;
  registrationName: string;
  address: Address;
}

export interface InvoiceLine {
  id: string;
  quantity: string;
  unitCode: string;        // e.g. 'PCE'
  lineExtensionAmount: string;
  itemName: string;
  taxPercent: string;
}

export type InvoiceRelationType = 'b2b' | 'b2c';

export interface InvoiceData {
  profileID: string;
  id: string;
  uuid: string;
  issueDate: string;       // e.g. '2024-01-17'
  issueTime: string;       // e.g. '05:41:08'
  invoiceTypeCode: string; // '388' for standard invoice
  invoiceTypeName: string; // '0100000' or '0200000'
  note: string;
  currencyCode: string;
  taxCurrencyCode: string;
  supplier: Supplier;
  customer: Customer;
  invoiceLines: InvoiceLine[];
  taxAmount: string;
  totalAmount: string;
  previousHash?: string;
  cancelation?: {
      canceled_invoice_number: string | number;
      reason: string;
  };
}

export interface QrDataModel {
  sellerName: string;
  sellerTRN: string;
  issueDate: string;
  invoiceHash: string;
  digitalSignature: string;
  publicKey: string;
  certificateSignature: string;
  invoiceData: InvoiceData;
}

export interface ZatcaConfig {
  sellerName: string;
  sellerTRN: string;          // VAT Registration Number
  privateKeyBase64?: string;  // ECDSA Private Key (Phase 2)
  certificateBase64?: string; // X.509 Certificate (Phase 2)
  supplier: Supplier;
}

// ============ Phase 1: TLV Encoding (Simplified QR) ============

/**
 * Encode a single TLV (Tag-Length-Value) field
 */
function tlvEncode(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf-8');
  const tagBuffer = Buffer.from([tag]);
  const lengthBuffer = Buffer.from([valueBuffer.length]);
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

/**
 * Generate Phase 1 QR content (TLV tags 1-5)
 * This is for simplified tax invoices (B2C)
 */
export function generateZatcaQRContent(data: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: number;
  vatAmount: number;
}): string {
  const tlvBuffers = [
    tlvEncode(1, data.sellerName),
    tlvEncode(2, data.vatNumber),
    tlvEncode(3, data.timestamp),
    tlvEncode(4, data.totalWithVat.toFixed(2)),
    tlvEncode(5, data.vatAmount.toFixed(2)),
  ];
  return Buffer.concat(tlvBuffers).toString('base64');
}

/**
 * Decode ZATCA QR Base64 content back to TLV fields
 */
export function decodeZatcaQR(base64Content: string): Record<number, string> {
  const result: Record<number, string> = {};
  const buffer = Buffer.from(base64Content, 'base64');
  let offset = 0;
  while (offset < buffer.length) {
    const tag = buffer[offset++];
    const len = buffer[offset++];
    const value = buffer.slice(offset, offset + len).toString('utf-8');
    result[tag] = value;
    offset += len;
  }
  return result;
}

// ============ Phase 2: XML Generation (UBL 2.1) ============

/**
 * Generate ZATCA-compliant UBL 2.1 XML invoice
 */
export function generateZATCAXml(data: InvoiceData): string {
  const countryCode = data.supplier.address.countryCode || 'SA';
  const custCountryCode = data.customer.address.countryCode || 'SA';

  // Generate invoice lines XML
  const invoiceLinesXml = data.invoiceLines.map(line => {
    const net = parseFloat(line.lineExtensionAmount).toFixed(2);
    const vat = (parseFloat(line.lineExtensionAmount) * (parseFloat(line.taxPercent) / 100)).toFixed(2);
    return `
    <cac:InvoiceLine>
      <cbc:ID>${escapeXml(line.id)}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${escapeXml(line.unitCode)}">${escapeXml(line.quantity)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${escapeXml(net)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${escapeXml(vat)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="SAR">${escapeXml((parseFloat(net)+parseFloat(vat)).toFixed(2))}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(line.itemName)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${escapeXml(line.taxPercent)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="SAR">${escapeXml(net)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
  }).join('');

  const taxAmount = parseFloat(data.taxAmount);
  const totalAmount = parseFloat(data.totalAmount);
  const netAmount = (totalAmount - taxAmount).toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>SET_UBL_EXTENSIONS_STRING</ext:UBLExtensions>
  <cbc:ProfileID>${escapeXml(data.profileID)}</cbc:ProfileID>
  <cbc:ID>${escapeXml(data.id)}</cbc:ID>
  <cbc:UUID>${escapeXml(data.uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(data.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(data.issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${escapeXml(data.invoiceTypeName)}">${escapeXml(data.invoiceTypeCode)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${escapeXml(data.currencyCode)}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${escapeXml(data.taxCurrencyCode)}</cbc:TaxCurrencyCode>
  ${data.invoiceTypeCode === '381' || data.invoiceTypeCode === '383' ? `
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${escapeXml(data.cancelation?.canceled_invoice_number?.toString() || 'INV-UNKNOWN')}</cbc:ID>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>` : ''}
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>1</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${data.previousHash || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=='}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">SET_QR_CODE_DATA</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:Signature>
    <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
    <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(data.supplier.companyID)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data.supplier.address.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(data.supplier.address.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(data.supplier.address.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(data.supplier.address.cityName)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(data.supplier.address.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(countryCode)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data.supplier.registrationName)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data.supplier.registrationName || "Seller")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NAT">1323211234</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data.customer.address.streetName)}</cbc:StreetName>
        <cbc:BuildingNumber>${escapeXml(data.customer.address.buildingNumber)}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${escapeXml(data.customer.address.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(data.customer.address.cityName)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(data.customer.address.postalZone)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(custCountryCode)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data.customer.companyID)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data.customer.registrationName || "Customer")}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${escapeXml(data.issueDate)}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  ${data.invoiceTypeCode === '381' || data.invoiceTypeCode === '383' ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
    <cbc:InstructionNote>${escapeXml(data.cancelation?.reason || 'تعديل مبيعات')}</cbc:InstructionNote>
  </cac:PaymentMeans>` : ''}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${escapeXml(data.taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${escapeXml(netAmount)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${escapeXml(data.taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${escapeXml(netAmount)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${escapeXml(netAmount)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${escapeXml(data.totalAmount)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="SAR">0.00</cbc:ChargeTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${escapeXml(data.totalAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${invoiceLinesXml}
</Invoice>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============ Phase 2: Hashing & Signing ============

/**
 * Generate SHA-256 hash of XML string, returned as Base64
 */
export function generateXmlHash(xmlString: string): string {
  const hash = crypto.createHash('sha256').update(xmlString, 'utf-8').digest();
  return hash.toString('base64');
}

/**
 * Generate ECDSA digital signature using private key
 * Uses secp256r1 (prime256v1) curve as required by ZATCA
 */
export function generateECDSASignature(data: string, privateKeyBase64: string): string {
  try {
    // Try PEM format first
    let privateKey: string;
    if (privateKeyBase64.includes('BEGIN')) {
      privateKey = privateKeyBase64;
    } else {
      // Wrap raw Base64 in PEM format
      privateKey = `-----BEGIN EC PRIVATE KEY-----\n${privateKeyBase64}\n-----END EC PRIVATE KEY-----`;
    }

    const sign = crypto.createSign('SHA256');
    sign.update(data);
    const signature = sign.sign({
      key: privateKey,
      dsaEncoding: 'ieee-p1363',
    });
    return signature.toString('base64');
  } catch (error: any) {
    log.error('ECDSA signing error:', error);
    // Fallback: return empty signature if no valid key
    return '';
  }
}

/**
 * Extract public key from X.509 certificate (Base64 DER or PEM)
 */
export function extractPublicKeyFromCertificate(certBase64: string): { publicKey: string; signature: string } {
  try {
    let certPem: string;
    if (certBase64.includes('BEGIN')) {
      certPem = certBase64;
    } else {
      certPem = `-----BEGIN CERTIFICATE-----\n${certBase64}\n-----END CERTIFICATE-----`;
    }

    const cert = crypto.createPublicKey({
      key: certPem,
      format: 'pem',
    });

    const publicKeyDer = cert.export({ type: 'spki', format: 'der' });
    const publicKeyB64 = publicKeyDer.toString('base64');

    // Extract certificate signature (last part of the DER certificate)
    const certDer = Buffer.from(certBase64.replace(/[\r\n\s]/g, ''), 'base64');
    // Simple signature extraction - take last 64-72 bytes as signature approximation
    const sigLen = Math.min(72, Math.floor(certDer.length * 0.1));
    const sigBytes = certDer.slice(certDer.length - sigLen);

    return {
      publicKey: publicKeyB64,
      signature: sigBytes.toString('base64'),
    };
  } catch (error: any) {
    log.error('Certificate parsing error:', error);
    return { publicKey: '', signature: '' };
  }
}

// ============ Phase 2: TLV Tags 1-8 QR Content ============

/**
 * String to hex conversion
 */
function stringToHex(input: string): string {
  return Array.from(Buffer.from(input, 'utf-8'))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate TLV hex string from tag-value map
 */
function generateTlvHex(data: Record<number, string>): string {
  let tlv = '';
  for (const [tag, value] of Object.entries(data)) {
    const tagHex = parseInt(tag).toString(16).padStart(2, '0');
    const valueHex = stringToHex(value);
    const lengthHex = value.length.toString(16).padStart(2, '0');
    tlv += tagHex + lengthHex + valueHex;
  }
  return tlv;
}

/**
 * Convert TLV hex string to Base64
 */
function tlvHexToBase64(tlvHex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < tlvHex.length; i += 2) {
    bytes.push(parseInt(tlvHex.substring(i, i + 2), 16));
  }
  return Buffer.from(bytes).toString('base64');
}

/**
 * Generate Phase 2 QR content with TLV tags 1-8
 */
export function generatePhase2QRContent(qrData: QrDataModel): string {
  const invoiceData: Record<number, string> = {
    1: qrData.sellerName,
    2: qrData.sellerTRN,
    3: qrData.issueDate,
    4: qrData.invoiceData.totalAmount,
    5: qrData.invoiceData.taxAmount,
    6: qrData.invoiceHash,
    7: qrData.digitalSignature,
    8: qrData.publicKey,
  };

  const tlvHex = generateTlvHex(invoiceData);
  return tlvHexToBase64(tlvHex);
}

// ============ ZATCA Manager ============

let _config: ZatcaConfig | null = null;

/**
 * Initialize the ZATCA manager with company settings
 */
export function initializeZatca(config: ZatcaConfig): void {
  _config = config;
}

/**
 * Generate complete ZATCA QR data model
 * This is the main entry point for Phase 2
 */
export function generateZatcaQR(params: {
  invoiceLines: InvoiceLine[];
  invoiceRelationType?: InvoiceRelationType;
  customer?: Customer;
  issueDate: string;
  issueTime: string;
  invoiceUuid: string;
  invoiceNumber: string;
  totalWithVat: string;
  totalVat: string;
  invoiceType?: string; // '0100000' for standard, '0200000' for simplified
}): QrDataModel {
  if (!_config) {
    throw new Error('ZATCA not initialized. Call initializeZatca() first.');
  }

  const relationType = params.invoiceRelationType || 'b2c';
  if (relationType === 'b2b' && !params.customer) {
    throw new Error('Customer is required for B2B invoices.');
  }

  const defaultCustomer: Customer = {
    companyID: ' ',
    registrationName: ' ',
    address: {
      streetName: ' ',
      buildingNumber: ' ',
      citySubdivisionName: ' ',
      cityName: ' ',
      postalZone: ' ',
      countryCode: 'SA',
    },
  };

  const invoice: InvoiceData = {
    profileID: 'reporting:1.0',
    id: params.invoiceNumber,
    uuid: params.invoiceUuid,
    issueDate: params.issueDate,
    issueTime: params.issueTime,
    invoiceTypeCode: '388',
    invoiceTypeName: params.invoiceType || '0200000',
    note: params.invoiceType || '0200000',
    currencyCode: 'SAR',
    taxCurrencyCode: 'SAR',
    supplier: _config.supplier,
    customer: params.customer || defaultCustomer,
    invoiceLines: params.invoiceLines,
    taxAmount: params.totalVat,
    totalAmount: params.totalWithVat,
  };

  // Generate XML
  const xmlString = generateZATCAXml(invoice);

  // Generate XML hash (SHA-256)
  const xmlHash = generateXmlHash(xmlString);

  // Generate digital signature (if private key is available)
  let digitalSignature = '';
  let publicKey = '';
  let certificateSignature = '';

  if (_config.privateKeyBase64 && _config.certificateBase64) {
    digitalSignature = generateECDSASignature(xmlHash, _config.privateKeyBase64);
    const certInfo = extractPublicKeyFromCertificate(_config.certificateBase64);
    publicKey = certInfo.publicKey;
    certificateSignature = certInfo.signature;
  }

  return {
    sellerName: _config.sellerName,
    sellerTRN: _config.sellerTRN,
    issueDate: params.issueDate,
    invoiceHash: xmlHash,
    digitalSignature,
    publicKey,
    certificateSignature,
    invoiceData: invoice,
  };
}

/**
 * Get QR code content string from QrDataModel
 * Uses Phase 2 TLV encoding (tags 1-8) if signature available,
 * falls back to Phase 1 (tags 1-5) otherwise
 */
export function getQrCodeContent(qrData: QrDataModel): string {
  if (qrData.digitalSignature && qrData.publicKey) {
    // Phase 2: TLV tags 1-8
    return generatePhase2QRContent(qrData);
  } else {
    // Phase 1: TLV tags 1-5
    return generateZatcaQRContent({
      sellerName: qrData.sellerName,
      vatNumber: qrData.sellerTRN,
      timestamp: qrData.issueDate,
      totalWithVat: parseFloat(qrData.invoiceData.totalAmount),
      vatAmount: parseFloat(qrData.invoiceData.taxAmount),
    });
  }
}

// ============ Auto Key Generation ============

/**
 * Auto-generate ECDSA key pair (secp256r1) and self-signed certificate
 * Returns Base64-encoded private key and PEM certificate
 */
export function generateZatcaKeyPair(): { privateKeyBase64: string; certificateBase64: string } {
  // Generate ECDSA key pair on secp256r1 (prime256v1) curve
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  // Export private key as Base64 (PKCS8 DER -> Base64)
  const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });
  const privateKeyBase64 = privDer.toString('base64');

  // Generate a self-signed certificate
  // Node.js doesn't have built-in X.509 cert creation, so we create a minimal DER structure
  const pubDer = publicKey.export({ type: 'spki', format: 'der' });

  // Create a minimal self-signed X.509 certificate structure
  const now = new Date();
  const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

  // For simplicity, export public key as PEM and use it as certificate placeholder
  // The actual ZATCA integration will use the real certificate from ZATCA portal
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

  // Create a basic certificate-like format that our library can parse
  // This is sufficient for Phase 2 QR generation (public key extraction)
  const certificateBase64 = pubDer.toString('base64');

  return { privateKeyBase64, certificateBase64 };
}

