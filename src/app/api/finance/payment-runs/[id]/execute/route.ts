import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withIdempotency } from '@/lib/idempotency';

const log = logger.child({ service: 'finance.payment-runs.id.execute' });


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    try {
        const { id } = await params;
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const userId = body.userId || '1';

        const result = await PaymentRunEngine.executePayments(parseInt(id, 10), userId, tenantId);
        return NextResponse.json(result);
    } catch (e: any) {
        log.error('src/app/api/finance/payment-runs/[id]/execute/route.ts', { error: e instanceof Error ? e.message : e });

        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => {
    return withIdempotency(req as NextRequest, 'POST /api/finance/payment-runs/[id]/execute', async () => _POST(req as NextRequest, context));
}, { rateLimit: 'DEFAULT' });
