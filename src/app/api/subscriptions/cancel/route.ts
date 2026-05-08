import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionEngine } from '@/lib/subscription-engine';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));
        const { subscriptionId, immediately } = body;
        
        if (!subscriptionId) {
            return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
        }

        const subscription = await SubscriptionEngine.cancelSubscription(
            parseInt(subscriptionId, 10),
            immediately === true
        );

        return NextResponse.json(subscription);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
