import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * CPQ API — Configure-Price-Quote
 * POST /api/cpq/price — Calculate dynamic price
 * POST /api/cpq/quote — Build complete quote
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { CPQEngine } from '@/lib/cpq-engine';

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const action = body.action || 'price';

        if (action === 'price') {
            if (!body.productId) return NextResponse.json({ error: 'مطلوب: productId' }, { status: 400 });
            const result = await CPQEngine.calculatePrice(prisma, body.productId, body.quantity || 1, body.customerId);
            return NextResponse.json(result);
        }

        if (action === 'quote') {
            if (!body.customerId || !body.lines?.length) {
                return NextResponse.json({ error: 'مطلوب: customerId, lines[]' }, { status: 400 });
            }
            const quote = await CPQEngine.buildQuote(prisma, body.customerId, body.lines);
            return NextResponse.json(quote);
        }

        if (action === 'convert' && body.quoteId) {
            const order = await CPQEngine.convertToSalesOrder(prisma, body.quoteId);
            return NextResponse.json(order);
        }

        return NextResponse.json({ error: 'action مطلوب: price | quote | convert' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
