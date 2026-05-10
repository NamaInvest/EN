import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.payment-runs.id.submit-for-ap' });


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { userId } = body;
        
        const runId = parseInt((await params).id, 10);
        const updatedRun = await PaymentRunEngine.submitForApproval(runId, userId || 'system');

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
