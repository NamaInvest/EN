import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zatca.qr' });

// A simple Phase 1 TLV generator. In a real system, Phase 2 uses ECDSA signatures and hashes.
function getTLV(tag: number, value: string): Buffer {
    const valueBuffer = Buffer.from(value, 'utf8');
    const lengthBuffer = Buffer.alloc(1);
    lengthBuffer.writeUInt8(valueBuffer.length, 0);
    const tagBuffer = Buffer.alloc(1);
    tagBuffer.writeUInt8(tag, 0);
    return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}


const _POSTSchema = z.object({
  invoiceId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { invoiceId } = body;

        const invoice = await prisma.salesInvoice.findUnique({
            where: { id: Number(invoiceId) },
            include: { customer: true }
        });

        if (!invoice) throw new Error('Invoice not found');

        const settingsRaw = await prisma.setting.findMany({ take: 100,
            where: { key: { startsWith: 'zatca_' } }
        });
        const taxNumberSetting = await prisma.setting.findUnique({ where: { key: 'tax_number' } });

        const s = settingsRaw.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const isPhase2 = !!s['zatca_production_token'];

        // Core tags
        const sellerName = s['zatca_company_name'] || 'Nama Invest';
        const vatNumber = taxNumberSetting?.value || '314122115700003';
        const timestamp = invoice.date.toISOString();
        const total = invoice.total.toFixed(2);
        const tax = invoice.taxValue.toFixed(2);

        const tags = [
            getTLV(1, sellerName),
            getTLV(2, vatNumber),
            getTLV(3, timestamp),
            getTLV(4, total),
            getTLV(5, tax)
        ];

        // If Phase 2, we should include Hash, ECDSA Signature, Public Key, and Cert Signature
        if (isPhase2) {
            // Demo for Phase 2 Tags 6-9
            tags.push(getTLV(6, 'dummy-hash'));
            tags.push(getTLV(7, 'dummy-ecdsa'));
            tags.push(getTLV(8, 'dummy-public-key'));
            tags.push(getTLV(9, 'dummy-cert-sig'));
        }

        const tlvBuffer = Buffer.concat(tags);
        const base64String = tlvBuffer.toString('base64');
        const qrDataUrl = await QRCode.toDataURL(base64String);

        // Save QR to DB
        await prisma.salesInvoice.update({
            where: { id: invoice.id },
            data: { 
                zatcaQr: qrDataUrl, 
                zatcaStatus: isPhase2 ? 'REPORTED' : 'PHASE_1_QR' 
            }
        });

        return NextResponse.json({ success: true, qrDataUrl, phase: isPhase2 ? 2 : 1 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
