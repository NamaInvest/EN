/**
 * Three-Way Match API
 * POST /api/purchasing/three-way-match — Execute match (PO ↔ GRN ↔ Invoice)
 * GET  /api/purchasing/three-way-match?invoiceId=X — Check match status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const invoiceId = req.nextUrl.searchParams.get('invoiceId');
    if (!invoiceId) return NextResponse.json({ error: 'مطلوب: invoiceId' }, { status: 400 });

    try {
        const invoice = await prisma.purchaseInvoice.findUnique({
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

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (!body.invoiceId) {
            return NextResponse.json({ error: 'مطلوب: invoiceId' }, { status: 400 });
        }

        // Use existing three-way-match engine
        const { ThreeWayMatch } = await import('@/lib/three-way-match');
        const result = await ThreeWayMatch.execute(prisma, body.invoiceId);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
