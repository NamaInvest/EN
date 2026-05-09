import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

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

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
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
