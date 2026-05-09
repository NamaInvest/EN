import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { SubscriptionEngine } from '@/lib/subscription-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  planId: z.union([z.string(), z.number()]).optional(),
  paymentMethodId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
