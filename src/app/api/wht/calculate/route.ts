import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * WHT Calculate API  
 * POST /api/wht/calculate — Calculate WHT for an invoice
 */
import { NextRequest, NextResponse } from 'next/server';
import { WHTEngine } from '@/lib/wht-engine';

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        if (!body.invoiceId || !body.serviceType) {
            return NextResponse.json({ error: 'مطلوب: invoiceId, serviceType' }, { status: 400 });
        }

        // Preview only (no DB write)
        if (body.preview) {
            const result = await WHTEngine.calculateWHT(body.invoiceId, body.serviceType);
            return NextResponse.json(result || { whtAmount: 0, message: 'لا تنطبق ضريبة استقطاع' });
        }

        // Apply WHT
        const result = await WHTEngine.applyWHT(body.invoiceId, body.serviceType, String((user as any).id || 1));
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
