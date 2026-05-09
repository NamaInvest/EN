import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { dueDateUntil, currency, bankAccountId, includeDiscountWindow } = body;

        if (!dueDateUntil || !currency || !bankAccountId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const run = await PaymentRunEngine.proposePayments(
            new Date(dueDateUntil),
            currency,
            bankAccountId,
            includeDiscountWindow
        );

        return NextResponse.json(run);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
