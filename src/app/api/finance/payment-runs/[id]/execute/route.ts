import { NextRequest, NextResponse } from 'next/server';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

export async function POST(
    req: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await req.json().catch(() => ({}));
        const userId = body.userId || '1'; // Mock user

        const result = await PaymentRunEngine.executePayments(parseInt(id, 10), userId);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
