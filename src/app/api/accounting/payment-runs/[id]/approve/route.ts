import { NextRequest, NextResponse } from 'next/server';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();
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
