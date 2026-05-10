import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.payment-runs' });

async function _GET(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const runs = await (prisma as any).paymentRun.findMany({
            take: 100,
            orderBy: { runDate: 'desc' },
            include: { _count: { select: { lines: true } } }
        });
        return NextResponse.json(runs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  runDate: z.string().optional(),
  nextPaymentDate: z.string().optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { runDate, nextPaymentDate, bankAccountId } = body;
        
        if (!runDate || !nextPaymentDate || !bankAccountId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const run = await PaymentRunEngine.proposePayments(
            new Date(runDate), 
            // @ts-expect-error [TS2345] Type mismatch Request/NextRequest - fix at Service Layer
            new Date(nextPaymentDate), 
            parseInt(bankAccountId, 10)
        );

        return NextResponse.json(run);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
