/**
 * CO-PA Post + Slice Report API
 * POST /api/copa/post — Create a CO-PA document
 * GET  /api/copa/report — Multi-dimensional profitability slice
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postCopaDocument, slice } from '@/lib/copa-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'copa' });


const _POSTSchema = z.object({
  sourceType: z.any().optional(),
  sourceId: z.union([z.string(), z.number()]).optional(),
  postingDate: z.string().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  productId: z.union([z.string(), z.number()]).optional(),
  channelCode: z.any().optional(),
  regionCode: z.any().optional(),
  profitCenterId: z.union([z.string(), z.number()]).optional(),
  segmentId: z.union([z.string(), z.number()]).optional(),
  revenue: z.any().optional(),
  cogs: z.any().optional(),
  discount: z.number().optional(),
  freight: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const prisma = await getPrisma(req);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

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

async function _GET(req: NextRequest) {

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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
