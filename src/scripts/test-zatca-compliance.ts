/**
 * End-to-end ZATCA compliance test using zatca-xml-js SDK
 * Uses SDK for invoice generation + signing, our correct API URLs + auth
 */
import { PrismaClient } from '@prisma/client';

const ZATCA_BASE = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';

async function main() {
    const prisma = new PrismaClient();

    const { ZATCASimplifiedTaxInvoice, ZATCAPaymentMethods } = require('zatca-xml-js');
    const { generateSignedXMLString } = require('zatca-xml-js/lib/zatca/signing');

    // Read settings
    const settings = await prisma.setting.findMany();
    const s: Record<string, string> = {};
    settings.forEach((st: any) => { s[st.key] = st.value ?? ''; });

    const complianceToken = s['zatca_compliance_token'];
    const complianceSecret = s['zatca_compliance_secret'];
    const privateKeyBase64 = s['zatca_private_key'];

    if (!complianceToken || !complianceSecret || !privateKeyBase64) {
        console.log('❌ Missing credentials. Run compliance CSID step first.');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ Credentials loaded');

    // Decode certificate from binarySecurityToken
    const certPemBody = Buffer.from(complianceToken, 'base64').toString();
    const certificate = `-----BEGIN CERTIFICATE-----\n${certPemBody}\n-----END CERTIFICATE-----`;
    const privateKey = `-----BEGIN EC PRIVATE KEY-----\n${privateKeyBase64}\n-----END EC PRIVATE KEY-----`;

    // Create EGS info
    const egsInfo = {
        uuid: 'c904e867-f35a-452d-8a9d-c5f195edb5ee',
        CRN_number: s['zatca_crn'] || '7051170095',
        VAT_name: s['company_name_en'] || s['company_name'] || 'nama invest',
        VAT_number: s['tax_number'] || '314122115700003',
        location: {
            city: 'NAJRAN',
            city_subdivision: 'NAJRAN',
            street: s['zatca_street'] || 'Main',
            plot_identification: '0000',
            building: s['zatca_building'] || '0000',
            postal_zone: '62523',
        },
        branch_name: 'Main',
        branch_industry: 'Technology',
    };

    // SHA256("0") base64 for first invoice PIH
    const initialPIH = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

    console.log('\n📝 Creating invoice...');
    const invoice = new ZATCASimplifiedTaxInvoice({
        props: {
            egs_info: egsInfo,
            invoice_counter_number: 1,
            invoice_serial_number: 'INV-COMP-001',
            issue_date: new Date().toISOString().split('T')[0],
            issue_time: new Date().toTimeString().split(' ')[0],
            previous_invoice_hash: initialPIH,
            line_items: [{
                id: '1',
                name: 'Test Product',
                quantity: 1,
                tax_exclusive_price: 100,
                VAT_percent: 0.15,
                other_taxes: [],
                discounts: [],
            }],
        },
        payment_method: ZATCAPaymentMethods.CASH,
    });

    console.log('✅ Invoice XML created');

    // Sign
    console.log('🔏 Signing...');
    const { signed_invoice_string, invoice_hash, qr } = generateSignedXMLString({
        invoice_xml: invoice.invoice_xml,
        certificate_string: certificate,
        private_key_string: privateKey,
    });
    console.log(`✅ Signed! Hash: ${invoice_hash}`);

    // Auth: SAME as our app — base64(binarySecurityToken:secret)
    const auth = Buffer.from(`${complianceToken}:${complianceSecret}`).toString('base64');
    const invoiceBase64 = Buffer.from(signed_invoice_string).toString('base64');

    console.log('\n📡 Submitting...');
    const resp = await fetch(`${ZATCA_BASE}/compliance/invoices`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Version': 'V2',
            'Accept-Language': 'en',
            'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
            invoiceHash: invoice_hash,
            uuid: egsInfo.uuid,
            invoice: invoiceBase64,
        }),
    });

    const text = await resp.text();
    console.log(`Status: ${resp.status}`);

    try {
        const data = JSON.parse(text);
        if (data.validationResults) {
            const vr = data.validationResults;
            console.log(`\n📋 Result: ${vr.status}`);
            if (vr.warningMessages?.length) console.log(`⚠️ ${vr.warningMessages.length} warnings`);
            if (vr.errorMessages?.length) {
                console.log(`❌ ${vr.errorMessages.length} errors:`);
                vr.errorMessages.forEach((e: any) => console.log(`   ${e.code}: ${e.message?.substring(0, 80)}`));
            }
            if (vr.status === 'PASS' || vr.status === 'WARNING') {
                console.log('\n🎉🎉🎉 COMPLIANCE PASSED! 🎉🎉🎉');
            }
        } else {
            console.log(`Response: ${text.substring(0, 300)}`);
        }
    } catch { console.log(`Response: ${text.substring(0, 300)}`); }

    await prisma.$disconnect();
}

main().catch(console.error);
