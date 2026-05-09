import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';
import { prisma } from '@/lib/prisma';

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

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

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
