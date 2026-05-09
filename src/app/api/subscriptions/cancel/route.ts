import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { SubscriptionEngine } from '@/lib/subscription-engine';

async function _POST(req: NextRequest) {

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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
