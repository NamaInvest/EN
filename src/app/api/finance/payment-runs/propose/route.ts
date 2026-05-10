import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.payment-runs.propose' });


const _POSTSchema = z.object({
  dueDateUntil: z.string().optional(),
  currency: z.any().optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
  includeDiscountWindow: z.number().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
