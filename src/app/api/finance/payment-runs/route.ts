import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

export async function GET(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const runs = await prisma.paymentRun.findMany({
            take: 100,
            orderBy: { runDate: 'desc' },
            include: { _count: { select: { lines: true } } }
        });
        return NextResponse.json(runs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { runDate, nextPaymentDate, bankAccountId } = body;
        
        if (!runDate || !nextPaymentDate || !bankAccountId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const run = await PaymentRunEngine.proposePayments(
            new Date(runDate), 
            new Date(nextPaymentDate), 
            parseInt(bankAccountId, 10)
        );

        return NextResponse.json(run);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
