import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import crypto from 'crypto';

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = parseInt((await params).id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await req.json();
        const { vendorIds } = body; // array of vendor portal user ids

        if (!vendorIds || !Array.isArray(vendorIds)) {
            return NextResponse.json({ error: 'vendorIds array is required' }, { status: 400 });
        }

        const rfq = await prisma.requestForQuotation.findUnique({ where: { id } });
        if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

        const createdTokens = [];
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48h validity

        for (const vId of vendorIds) {
            const tokenStr = crypto.randomBytes(32).toString('hex');
            
            const token = await prisma.vendorPortalToken.create({
                data: {
                    vendorId: parseInt(vId),
                    rfqId: id,
                    token: tokenStr,
                    expiresAt
                }
            });

            createdTokens.push(token);
            // MOCK EMAIL SENDING:
            console.log(`Sending email to Vendor ID ${vId}: Your RFQ link is https://your-domain/portal/vendor/rfq/${id}?token=${tokenStr}`);
        }

        // Update RFQ status to 'sent'
        await prisma.requestForQuotation.update({
            where: { id },
            data: { status: 'sent' }
        });

        return NextResponse.json({ success: true, tokens: createdTokens.length });

    } catch (e: any) {
        console.error('Invite Vendor Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
