import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { SubscriptionEngine } from '@/lib/subscription-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'subscriptions.cancel' });


const _POSTSchema = z.object({
  subscriptionId: z.union([z.string(), z.number()]).optional(),
  immediately: z.string().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
