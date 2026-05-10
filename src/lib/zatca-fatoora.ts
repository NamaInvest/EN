/**
 * ZATCA Fatoora Platform Integration
 * OTA (Onboarding and Taxpayer Automation) for Phase 2
 * 
 * Endpoints:
 * - Compliance CSID: Get compliance certificate using CSR + OTP
 * - Compliance Invoice: Submit test invoices for compliance check
 * - Production CSID: Get production certificate after compliance
 * - Reporting: Submit B2C simplified invoices (within 24h)
 * - Clearance: Submit B2B standard invoices (real-time)
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.zatca-fatoor' });

// ============ Configuration ============

const ZATCA_ENVIRONMENTS = {
    simulation: {
        compliance: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/compliance',
        complianceInvoice: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/compliance/invoices',
        productionCSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/production/csids',
        reporting: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/reporting/single',
        clearance: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/clearance/single',
    },
    production: {
        compliance: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/compliance',
        complianceInvoice: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/compliance/invoices',
        productionCSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/production/csids',
        reporting: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/reporting/single',
        clearance: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core/invoices/clearance/single',
    },
};

export type ZatcaEnvironment = 'simulation' | 'production';

export interface ZatcaCSIDResponse {
    requestID: string;
    binarySecurityToken: string;  // Base64 encoded certificate
    secret: string;               // API secret for auth
    errors?: string[];
    warnings?: string[];
}

export interface ZatcaInvoiceResponse {
    invoiceHash: string;
    status: 'PASS' | 'WARNING' | 'ERROR';
    clearanceStatus?: string;
    reportingStatus?: string;
    warnings?: Array<{ code: string; message: string }>;
    errors?: Array<{ code: string; message: string }>;
    clearedInvoice?: string;  // Base64 XML (for clearance)
}

// ============ CSR Generation ============

/**
 * Generate a CSR (Certificate Signing Request) for ZATCA onboarding.
 * Uses ECDSA secp256r1 (prime256v1) as required by ZATCA.
 */
export function generateCSR(params: {
    commonName: string;      // e.g. EGS unit name
    organizationName: string;
    organizationUnit: string;
    country?: string;         // default: SA
    serialNumber: string;     // EGS serial number: 1-TST|2-TST|3-..
    vatNumber: string;        // 15-digit VAT registration number
    invoiceType?: string;     // '1100' for standard+simplified
    location?: string;        // e.g. branch location
    industry?: string;        // e.g. 'Technology'
}): { privateKey: string; csr: string } {
    // Generate ECDSA key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
    });

    const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const privBase64 = (privateKey.export({ type: 'pkcs8', format: 'der' }) as Buffer).toString('base64');

    // ZATCA requires specific OIDs in CSR Subject
    // Build CSR subject fields
    const country = params.country || 'SA';
    const invoiceType = params.invoiceType || '1100';

    // For Node.js, we'll create a simplified CSR representation
    // The actual CSR would need openssl or a specialized library
    // Store all the CSR data for the user to generate via openssl if needed
    const csrData = {
        CN: params.commonName,
        OU: params.organizationUnit,
        O: params.organizationName,
        C: country,
        SN: params.serialNumber,
        UID: params.vatNumber,
        title: invoiceType,
        registeredAddress: params.location || '',
        businessCategory: params.industry || '',
    };

    // Build subject string for openssl
    const subject = `/C=${country}/OU=${params.organizationUnit}/O=${params.organizationName}/CN=${params.commonName}`;

    // For ZATCA, the CSR needs to include specific ZATCA OIDs
    // We store the config for reference
    const csrConfig = `
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
C = ${country}
OU = ${params.organizationUnit}
O = ${params.organizationName}
CN = ${params.commonName}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment

# ZATCA specific OIDs
2.5.4.5 = ${params.serialNumber}
0.9.2342.19200300.100.1.1 = ${params.vatNumber}
2.5.4.12 = ${invoiceType}
2.5.4.26 = ${params.location || 'Riyadh'}
2.5.4.15 = ${params.industry || 'Technology'}
`;

    return {
        privateKey: privBase64,
        csr: Buffer.from(csrConfig).toString('base64'), // Base64 encoded CSR config
    };
}

// ============ ZATCA API Functions ============

/**
 * Step 1: Get Compliance CSID using CSR + OTP from Fatoora portal
 */
export async function getComplianceCSID(params: {
    csrBase64: string;
    otp: string;
    environment?: ZatcaEnvironment;
}): Promise<ZatcaCSIDResponse> {
    const env = params.environment || 'simulation';
    const url = ZATCA_ENVIRONMENTS[env].compliance;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'OTP': params.otp,
        },
        body: JSON.stringify({
            // ZATCA SDK sends: Buffer.from(csrPemText).toString("base64")
            // csrBase64 is now the full PEM text, so we base64-encode it
            csr: Buffer.from(params.csrBase64).toString('base64'),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Compliance CSID failed (${response.status}): ${error}`);
    }

    return response.json();
}

/**
 * Step 2: Submit compliance invoice for validation
 */
export async function submitComplianceInvoice(params: {
    binarySecurityToken: string;
    secret: string;
    invoiceHash: string;
    uuid: string;
    invoiceBase64: string;
    environment?: ZatcaEnvironment;
}): Promise<ZatcaInvoiceResponse> {
    const env = params.environment || 'simulation';
    const url = ZATCA_ENVIRONMENTS[env].complianceInvoice;

    // Authentication: Basic auth with binarySecurityToken:secret
    const auth = Buffer.from(`${params.binarySecurityToken}:${params.secret}`).toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'ar',
            'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
            invoiceHash: params.invoiceHash,
            uuid: params.uuid,
            invoice: params.invoiceBase64,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Compliance invoice failed (${response.status}): ${error}`);
    }

    return response.json();
}

/**
 * Step 3: Get Production CSID after compliance checks pass
 */
export async function getProductionCSID(params: {
    complianceRequestId: string;
    binarySecurityToken: string;
    secret: string;
    environment?: ZatcaEnvironment;
}): Promise<ZatcaCSIDResponse> {
    const env = params.environment || 'simulation';
    const url = ZATCA_ENVIRONMENTS[env].productionCSID;

    const auth = Buffer.from(`${params.binarySecurityToken}:${params.secret}`).toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
            compliance_request_id: params.complianceRequestId,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Production CSID failed (${response.status}): ${error}`);
    }

    return response.json();
}

/**
 * Step 4a: Report a B2C simplified invoice (within 24 hours)
 */
export async function reportInvoice(params: {
    binarySecurityToken: string;
    secret: string;
    invoiceHash: string;
    uuid: string;
    invoiceBase64: string;
    environment?: ZatcaEnvironment;
}): Promise<ZatcaInvoiceResponse> {
    const env = params.environment || 'production';
    const url = ZATCA_ENVIRONMENTS[env].reporting;

    const auth = Buffer.from(`${params.binarySecurityToken}:${params.secret}`).toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'ar',
            'Clearance-Status': '0',
            'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
            invoiceHash: params.invoiceHash,
            uuid: params.uuid,
            invoice: params.invoiceBase64,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Invoice reporting failed (${response.status}): ${error}`);
    }

    return response.json();
}

/**
 * Step 4b: Clear a B2B standard invoice (real-time)
 */
export async function clearInvoice(params: {
    binarySecurityToken: string;
    secret: string;
    invoiceHash: string;
    uuid: string;
    invoiceBase64: string;
    environment?: ZatcaEnvironment;
}): Promise<ZatcaInvoiceResponse> {
    const env = params.environment || 'production';
    const url = ZATCA_ENVIRONMENTS[env].clearance;

    const auth = Buffer.from(`${params.binarySecurityToken}:${params.secret}`).toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'ar',
            'Clearance-Status': '1',
            'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
            invoiceHash: params.invoiceHash,
            uuid: params.uuid,
            invoice: params.invoiceBase64,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Invoice clearance failed (${response.status}): ${error}`);
    }

    return response.json();
}

// ============ Helper: Previous Invoice Hash (PIH) ============

/**
 * ZATCA requires chaining invoices with Previous Invoice Hash (PIH).
 * The first invoice uses a base64 of SHA256("0") as PIH.
 */
export function getInitialPIH(): string {
    return crypto.createHash('sha256').update('0').digest('base64');
}

/**
 * Generate invoice XML hash for ZATCA submission
 */
export function hashInvoiceXml(xmlString: string): string {
    return crypto.createHash('sha256').update(xmlString, 'utf-8').digest('base64');
}
