import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Three-Way Match API
 * POST /api/purchasing/three-way-match — Execute match (PO ↔ GRN ↔ Invoice)
 * GET  /api/purchasing/three-way-match?invoiceId=X — Check match status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchasing.three-way-match' });

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const invoiceId = req.nextUrl.searchParams.get('invoiceId');
    if (!invoiceId) return NextResponse.json({ error: 'مطلوب: invoiceId' }, { status: 400 });

    try {
        const invoice = await (prisma as any).purchaseInvoice.findUnique({
            where: { id: parseInt(invoiceId) },
            include: { lines: true },
        });
        if (!invoice) return NextResponse.json({ error: 'فاتورة غير موجودة' }, { status: 404 });

        // Check if PO and GRN references exist
        const inv = invoice as any;
        const hasPoRef = !!inv.purchaseOrderId;
        const hasGrnRef = !!inv.grnId;

        return NextResponse.json({
            invoiceId: invoice.id,
            poLinked: hasPoRef,
            grnLinked: hasGrnRef,
            matchStatus: hasPoRef && hasGrnRef ? 'FULLY_MATCHED' : hasPoRef || hasGrnRef ? 'PARTIAL' : 'UNMATCHED',
            total: invoice.total,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  invoiceId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (!body.invoiceId) {
            return NextResponse.json({ error: 'مطلوب: invoiceId' }, { status: 400 });
        }

        // Use existing three-way-match engine
        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
        const { ThreeWayMatch } = await import('@/lib/three-way-match');
        const result = await ThreeWayMatch.execute(prisma, body.invoiceId);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
