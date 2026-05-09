import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

async function _POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const userId = body.userId || '1';

        const result = await PaymentRunEngine.executePayments(parseInt(id, 10), userId);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
