/**
 * CO-PA Post + Slice Report API
 * POST /api/copa/post — Create a CO-PA document
 * GET  /api/copa/report — Multi-dimensional profitability slice
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { postCopaDocument, slice } from '@/lib/copa-engine';

export async function POST(req: NextRequest) {
    try {
        const prisma = await getPrisma(req);
        const body = await req.json();

        const result = await postCopaDocument(prisma, {
            sourceType: body.sourceType || 'MANUAL',
            sourceId: body.sourceId || 0,
            postingDate: body.postingDate ? new Date(body.postingDate) : new Date(),
            customerId: body.customerId,
            productId: body.productId,
            channelCode: body.channelCode,
            regionCode: body.regionCode,
            profitCenterId: body.profitCenterId,
            segmentId: body.segmentId,
            revenue: body.revenue,
            cogs: body.cogs,
            discount: body.discount,
            freight: body.freight,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ id: result.id }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const prisma = await getPrisma(req);
        const sp = req.nextUrl.searchParams;
        
        const dims = sp.get('dims')?.split(',').filter(Boolean) || ['customerId'];
        const filters = {
            from: sp.get('from') || undefined,
            to: sp.get('to') || undefined,
            customerId: sp.get('customerId') ? parseInt(sp.get('customerId')!) : undefined,
            productId: sp.get('productId') ? parseInt(sp.get('productId')!) : undefined,
            channelCode: sp.get('channelCode') || undefined,
            regionCode: sp.get('regionCode') || undefined,
            profitCenterId: sp.get('profitCenterId') ? parseInt(sp.get('profitCenterId')!) : undefined,
            segmentId: sp.get('segmentId') ? parseInt(sp.get('segmentId')!) : undefined,
        };

        const result = await slice(prisma, dims, filters);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
