const { ZATCASimplifiedTaxInvoice, ZATCAInvoiceTypes, ZATCAPaymentMethods } = require('zatca-xml-js');

/**
 * Offline ZATCA Signer for Electron
 * Generates XML, hashes, and signs locally using the Device's ZATCA certificate and private key.
 */

function signInvoiceOffline(invoiceData, settings) {
    try {
        // Map our invoice lines to ZATCA format
        const lineItems = (invoiceData.invoiceLines || []).map((line, idx) => ({
            id: (idx + 1).toString(),
            name: line.name || 'Item',
            quantity: line.quantity || 1,
            tax_exclusive_price: line.unitPrice || 0,
            VAT_percent: line.taxRate || 0.15,
        }));

        // Fallback if no line items
        if (lineItems.length === 0) {
            lineItems.push({
                id: '1',
                name: 'Item',
                quantity: 1,
                tax_exclusive_price: parseFloat(invoiceData.totalAmount || 0) / 1.15,
                VAT_percent: 0.15,
            });
        }

        // Build EGS unit info
        const egsInfo = {
            uuid: invoiceData.uuid,
            custom_id: settings.crn,
            model: 'NamaInvest-ERP-Offline',
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
        const invoiceProps = {
            egs_info: egsInfo,
            invoice_counter_number: settings.invoiceCounter || 1,
            invoice_serial_number: invoiceData.invoiceTypeCode === '381' ? `CN-${invoiceData.id}` : `INV-${invoiceData.id}`,
            issue_date: invoiceData.issueDate,
            issue_time: invoiceData.issueTime,
            previous_invoice_hash: settings.lastPih || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
            line_items: lineItems,
        };

        if (invoiceData.invoiceTypeCode === '381' && invoiceData.cancelation) {
            invoiceProps.cancelation = {
                canceled_invoice_number: invoiceData.cancelation.canceled_invoice_number,
                payment_method: ZATCAPaymentMethods.CASH,
                cancelation_type: ZATCAInvoiceTypes.CREDIT_NOTE,
                reason: invoiceData.cancelation.reason || 'مرتجع مبيعات',
            };
        }

        // Create the invoice XML
        const invoice = new ZATCASimplifiedTaxInvoice({ props: invoiceProps });

        // Sign with certificate and private key
        const { signed_invoice_string, invoice_hash, qr } = invoice.sign(
            settings.certificate,
            settings.privateKey
        );

        return {
            success: true,
            signedXml: signed_invoice_string,
            hash: invoice_hash,
            qr: qr,
            encodedInvoice: Buffer.from(signed_invoice_string).toString('base64'),
        };
    } catch (error) {
        console.error('Offline ZATCA Signing Error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    signInvoiceOffline
};
