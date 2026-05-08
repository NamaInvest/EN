import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionEngine } from '@/lib/subscription-engine';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));
        const { customerId, planId, paymentMethodId } = body;
        
        if (!customerId || !planId) {
            return NextResponse.json({ error: 'customerId and planId are required' }, { status: 400 });
        }

        const subscription = await SubscriptionEngine.subscribe(
            parseInt(customerId, 10),
            parseInt(planId, 10),
            paymentMethodId ? parseInt(paymentMethodId, 10) : undefined
        );

        return NextResponse.json(subscription);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
