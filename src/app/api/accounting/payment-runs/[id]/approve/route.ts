import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payment-runs/approve' });


const _POSTSchema = z.object({
  approvalId: z.union([z.string(), z.number()]).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  comments: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { approvalId, userId, comments } = body;
        
        await PaymentRunEngine.approveRun(approvalId, userId || 'system', comments);

        const run = await prisma.paymentRun.findUnique({
            where: { id: parseInt((await params).id, 10) }
        });

        return NextResponse.json(run);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
