import { NextRequest, NextResponse } from 'next/server';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

export async function POST(req: NextRequest) {
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
