import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import {
    generateZatcaQRContent,
} from '@/lib/zatca';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

// Load all ZATCA-related settings
async function loadZatcaSettings() {
    const settings = await prisma.setting.findMany({
        where: {
            key: {
                in: [
                    'company_name', 'company_name_en', 'tax_number', 'company_address', 'company_phone',
                    'zatca_enabled', 'zatca_private_key', 'zatca_certificate',
                    'zatca_crn', 'zatca_street', 'zatca_building', 'zatca_district',
                    'zatca_city', 'zatca_city_en', 'zatca_postal_code', 'zatca_industry', 'tax_rate',
                    'zatca_production_token', 'zatca_production_secret',
                    'zatca_last_pih', 'zatca_invoice_counter',
                ],
            },
        },
    });
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value || ''; });
    return map;
}

// Check if Phase 2 is ready (has production certificate from ZATCA)
function isPhase2(settings: Record<string, string>): boolean {
    return !!(settings['zatca_production_token'] && settings['zatca_private_key'] && settings['tax_number']);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { invoiceId } = body;

        const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        // Get line items
        const details = await prisma.salesInvoiceDetail.findMany({ where: { invoiceId } });

        // Customer name
        let customerName = 'عميل نقدي';
        if (invoice.customerId) {
            const cust = await prisma.customer.findUnique({ where: { id: invoice.customerId } });
            if (cust) customerName = cust.name;
        }

        // Settings
        const s = await loadZatcaSettings();
        const sellerName = s['company_name'] || 'الشركة غير مسجلة';
        const vatNumber = s['tax_number'] || '';
        const taxRate = parseFloat(s['tax_rate'] || '15') / 100;

        // Totals
        const subtotalVal = Number(invoice.subtotal) || 0;
        const discountRate = Number(invoice.discountRate) || 0;
        const afterDiscount = subtotalVal * (1 - discountRate / 100);
        const taxAmount = afterDiscount * taxRate;
        const totalWithVat = afterDiscount + taxAmount;

        let qrContent: string;
        let phase = 1;
        let xmlContent: string | undefined;

        if (isPhase2(s)) {
            // ===== Phase 2: Sign invoice via SDK subprocess =====
            phase = 2;

            const { execSync } = require('child_process');
            const fs = require('fs');
            const path = require('path');
            const os = require('os');

            // Helper: add line breaks every 64 chars for PEM format
            const wrapBase64 = (b64: string) => b64.replace(/(.{64})/g, '$1\n').trim();

            // Production certificate: ZATCA API returns binarySecurityToken as base64(PEM_body)
            // We must decode the outer base64 to get the actual PEM certificate body
            const certPemBody = Buffer.from(s['zatca_production_token'], 'base64').toString('ascii');
            const certificate = `-----BEGIN CERTIFICATE-----\n${wrapBase64(certPemBody)}\n-----END CERTIFICATE-----`;
            const privateKey = `-----BEGIN EC PRIVATE KEY-----\n${wrapBase64(s['zatca_private_key'])}\n-----END EC PRIVATE KEY-----`;

            // Invoice counter (auto-increment)
            const counterKey = 'zatca_invoice_counter';
            const currentCounter = parseInt(s[counterKey] || '0') + 1;

            // Previous Invoice Hash (PIH chain)
            const prevHash = s['zatca_last_pih'] || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

            const issueDate = invoice.date.toISOString().split('T')[0];
            const issueTime = invoice.date.toISOString().split('T')[1]?.substring(0, 8) || '00:00:00';
            const invoiceUuid = randomUUID();

            // Build line items for SDK
            const lineItems = details.map((d, idx) => ({
                id: (idx + 1).toString(),
                name: d.productName || `Product ${d.productId}`,
                quantity: d.quantity,
                tax_exclusive_price: Number(d.price),
                VAT_percent: taxRate,
                other_taxes: [],
                discounts: [],
            }));

            // Build signing input
            const signInput = {
                certificate,
                privateKey,
                egsInfo: {
                    uuid: invoiceUuid,
                    CRN_number: s['zatca_crn'] || '',
                    VAT_name: s['company_name_en'] || s['company_name'] || 'Company',
                    VAT_number: vatNumber,
                    location: {
                        city: s['zatca_city_en'] || s['zatca_city'] || 'Riyadh',
                        city_subdivision: s['zatca_district'] || 'District',
                        street: s['zatca_street'] || 'Main',
                        plot_identification: '0000',
                        building: s['zatca_building'] || '0000',
                        postal_zone: s['zatca_postal_code'] || '00000',
                    },
                    branch_name: 'Main',
                    branch_industry: s['zatca_industry'] || 'Technology',
                },
                invoiceCounterNumber: currentCounter,
                invoiceSerialNumber: `INV${invoice.invoiceNo.toString().padStart(6, '0')}`,
                issueDate,
                issueTime,
                previousInvoiceHash: prevHash,
                lineItems,
            };

            const ts = Date.now();
            const inputFile = path.join(os.tmpdir(), `zatca_qr_input_${ts}.json`);
            const outputFile = path.join(os.tmpdir(), `zatca_qr_output_${ts}.json`);
            const scriptFile = path.join(process.cwd(), 'src/scripts/zatca-sign-invoice.js');

            try {
                fs.writeFileSync(inputFile, JSON.stringify(signInput));
                execSync(`node "${scriptFile}" "${inputFile}" "${outputFile}"`, { encoding: 'utf-8', timeout: 30000 });

                const signOutput = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

                // Use the Phase 2 QR from SDK (includes TLV tags 1-8: hash, signature, public key)
                qrContent = signOutput.qr;
                xmlContent = signOutput.signed_invoice_string;

                // Update PIH and counter for chain
                await prisma.setting.upsert({
                    where: { key: 'zatca_last_pih' },
                    update: { value: signOutput.invoice_hash },
                    create: { key: 'zatca_last_pih', value: signOutput.invoice_hash, description: 'ZATCA Last Invoice Hash (PIH)' },
                });
                await prisma.setting.upsert({
                    where: { key: counterKey },
                    update: { value: currentCounter.toString() },
                    create: { key: counterKey, value: currentCounter.toString(), description: 'ZATCA Invoice Counter' },
                });
            } finally {
                try { fs.unlinkSync(inputFile); } catch { }
                try { fs.unlinkSync(outputFile); } catch { }
            }
        } else {
            // ===== Phase 1 (no production certificate) =====
            qrContent = generateZatcaQRContent({
                sellerName,
                vatNumber,
                timestamp: invoice.date.toISOString(),
                totalWithVat,
                vatAmount: taxAmount,
            });
        }

        const qrDataUrl = await QRCode.toDataURL(qrContent, {
            width: 200, margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M',
        });

        return NextResponse.json({
            qrDataUrl, qrContent, phase, xmlContent,
            invoiceDetails: {
                invoiceNumber: invoice.invoiceNo.toString(),
                date: invoice.date.toISOString(),
                sellerName, vatNumber,
                subtotal: afterDiscount.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                totalWithVat: totalWithVat.toFixed(2),
                customerName,
                paymentMethod: invoice.paymentType,
            },
        });
    } catch (error) {
        console.error('ZATCA QR error:', error);
        return NextResponse.json({ error: 'فشل في توليد QR Code' }, { status: 500 });
    }
}

// Preview QR (GET)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const s = await loadZatcaSettings();
        const sellerName = searchParams.get('seller') || s['company_name'] || 'الشركة غير مسجلة';
        const vatNumber = searchParams.get('vat') || s['tax_number'] || '';
        const total = parseFloat(searchParams.get('total') || '0');
        const tax = parseFloat(searchParams.get('tax') || '0');
        const dateParam = searchParams.get('date');
        const timestamp = dateParam ? new Date(dateParam).toISOString() : new Date().toISOString();

        const qrContent = generateZatcaQRContent({
            sellerName, vatNumber,
            timestamp,
            totalWithVat: total, vatAmount: tax,
        });

        const qrDataUrl = await QRCode.toDataURL(qrContent, {
            width: 200, margin: 2, errorCorrectionLevel: 'M',
        });

        return NextResponse.json({ qrDataUrl, qrContent, phase: isPhase2(s) ? 2 : 1 });
    } catch (error) {
        console.error('ZATCA QR GET error:', error);
        return NextResponse.json({ error: 'فشل في توليد QR Code' }, { status: 500 });
    }
}
