/**
 * ZATCA Phase 2 — Pure Node.js Signer (No Java SDK)
 * Uses zatca-xml-js for signing, hashing, QR generation
 * Uses ZATCA REST APIs for reporting/clearance
 */
import {
    EGS,
    ZATCASimplifiedTaxInvoice,
    ZATCASimplifiedInvoiceLineItem,
    ZATCASimplifiedInvoiceProps,
    ZATCAInvoiceTypes,
    ZATCAPaymentMethods,
} from 'zatca-xml-js';
import type { EGSUnitInfo } from 'zatca-xml-js';

// ========== Types ==========
export interface ZatcaSettings {
    companyName: string;
    companyNameEn: string;
    taxNumber: string;
    crn: string;
    street: string;
    building: string;
    district: string;
    city: string;
    cityEn: string;
    postalCode: string;
    privateKey: string;
    certificate: string;
    productionToken: string;
    productionSecret: string;
    environment: 'sandbox' | 'simulation' | 'production';
    lastPih: string;
    invoiceCounter: number;
}

export interface InvoiceLine {
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    subtotal: number;
    total: number;
}

export interface InvoiceData {
    id: string;
    uuid: string;
    issueDate: string;
    issueTime: string;
    invoiceTypeCode: string;
    invoiceTypeName: string;
    currencyCode: string;
    taxCurrencyCode: string;
    note: string;
    supplier: {
        companyID: string;
        registrationName: string;
        taxNumber: string;
        address: {
            streetName: string;
            buildingNumber: string;
            citySubdivisionName: string;
            cityName: string;
            postalZone: string;
            countryCode: string;
        };
    };
    customer: {
        companyID: string;
        registrationName: string;
        address: {
            streetName: string;
            buildingNumber: string;
            citySubdivisionName: string;
            cityName: string;
            postalZone: string;
            countryCode: string;
        };
    };
    invoiceLines: InvoiceLine[];
    taxAmount: string;
    totalAmount: string;
    cancelation?: {
        canceled_invoice_number: number;
        reason: string;
    };
}

export interface SignResult {
    signedXml: string;
    hash: string;
    qr: string;
    encodedInvoice: string;
}

// ========== ZATCA API Base URLs ==========
const ZATCA_URLS: Record<string, string> = {
    sandbox: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
    simulation: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation',
    production: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core',
};

// ========== Main Class ==========
export class ZatcaSigner {

    /**
     * Sign a simplified tax invoice (B2C) using zatca-xml-js
     */
    public signInvoice(invoiceData: InvoiceData, settings: ZatcaSettings): SignResult {
        // Map our invoice lines to ZATCA format
        const lineItems: ZATCASimplifiedInvoiceLineItem[] = invoiceData.invoiceLines.map((line, idx) => ({
            id: (idx + 1).toString(),
            name: line.name,
            quantity: line.quantity,
            tax_exclusive_price: line.unitPrice,
            VAT_percent: line.taxRate,  // library expects decimal e.g. 0.15, it multiplies by 100 internally
        }));

        // Fallback if no line items
        if (lineItems.length === 0) {
            lineItems.push({
                id: '1',
                name: 'Item',
                quantity: 1,
                tax_exclusive_price: parseFloat(invoiceData.totalAmount) / 1.15,
                VAT_percent: 0.15,
            });
        }

        // Build EGS unit info
        const egsInfo: EGSUnitInfo = {
            uuid: invoiceData.uuid,
            custom_id: settings.crn,
            model: 'NamaInvest-ERP',
            CRN_number: settings.crn,
            VAT_name: settings.companyName,
            VAT_number: settings.taxNumber,
            location: {
                city: settings.cityEn || settings.city || 'Riyadh',
                city_subdivision: settings.district || 'District',
                street: settings.street || 'Main',
                plot_identification: '0000',
                building: settings.building || '0000',
                postal_zone: settings.postalCode || '00000',
            },
            branch_name: settings.companyNameEn || settings.companyName || 'Main',
            branch_industry: 'General Trading',
        };

        // Build invoice props
        const invoiceProps: ZATCASimplifiedInvoiceProps = {
            egs_info: egsInfo,
            invoice_counter_number: settings.invoiceCounter,
            invoice_serial_number: invoiceData.invoiceTypeCode === '381' ? `CN-${invoiceData.id}` : `INV-${invoiceData.id}`,
            issue_date: invoiceData.issueDate,
            issue_time: invoiceData.issueTime,
            previous_invoice_hash: settings.lastPih || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
            line_items: lineItems,
            // Credit Note (381) or Debit Note (383): add cancelation to reference original invoice
            ...( (invoiceData.invoiceTypeCode === '381' || invoiceData.invoiceTypeCode === '383') && invoiceData.cancelation ? {
                cancelation: {
                    canceled_invoice_number: invoiceData.cancelation.canceled_invoice_number,
                    payment_method: ZATCAPaymentMethods.CASH,
                    cancelation_type: invoiceData.invoiceTypeCode === '381' ? ZATCAInvoiceTypes.CREDIT_NOTE : ZATCAInvoiceTypes.DEBIT_NOTE,
                    reason: invoiceData.cancelation.reason || 'تعديل مبيعات',
                }
            } : {}),
        };

        // Create the invoice XML
        const invoice = new ZATCASimplifiedTaxInvoice({ props: invoiceProps });

        // Sign with certificate and private key
        const { signed_invoice_string, invoice_hash, qr } = invoice.sign(
            settings.certificate,
            settings.privateKey
        );

        return {
            signedXml: signed_invoice_string,
            hash: invoice_hash,
            qr: qr,
            encodedInvoice: Buffer.from(signed_invoice_string).toString('base64'),
        };
    }

    /**
     * Report a simplified invoice (B2C) to ZATCA via REST API
     */
    public async reportInvoice(signedXml: string, invoiceHash: string, uuid: string, settings: ZatcaSettings): Promise<{
        status: string;
        reportingStatus?: string;
        validationResults?: any;
    }> {
        const baseUrl = ZATCA_URLS[settings.environment] || ZATCA_URLS.production;
        const bst = settings.productionToken;
        const auth = Buffer.from(`${bst}:${settings.productionSecret}`).toString('base64');
        const encodedInvoice = Buffer.from(signedXml).toString('base64');

        const response = await fetch(`${baseUrl}/invoices/reporting/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify({
                invoiceHash,
                uuid,
                invoice: encodedInvoice,
            }),
        });

        const result = await response.json();
        return {
            status: response.ok ? 'reported' : 'failed',
            reportingStatus: result.reportingStatus,
            validationResults: result.validationResults,
        };
    }

    /**
     * Clear a standard invoice (B2B) with ZATCA via REST API
     */
    public async clearInvoice(signedXml: string, invoiceHash: string, uuid: string, settings: ZatcaSettings): Promise<{
        status: string;
        clearedInvoice?: string;
        validationResults?: any;
    }> {
        const baseUrl = ZATCA_URLS[settings.environment] || ZATCA_URLS.production;
        const bst = settings.productionToken;
        const auth = Buffer.from(`${bst}:${settings.productionSecret}`).toString('base64');
        const encodedInvoice = Buffer.from(signedXml).toString('base64');

        const response = await fetch(`${baseUrl}/invoices/clearance/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
                'Clearance-Status': '1',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify({
                invoiceHash,
                uuid,
                invoice: encodedInvoice,
            }),
        });

        const result = await response.json();
        return {
            status: response.ok ? 'cleared' : 'failed',
            clearedInvoice: result.clearedInvoice,
            validationResults: result.validationResults,
        };
    }
}
