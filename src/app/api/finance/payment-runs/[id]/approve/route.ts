import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();
        const { approvalId, userId, comments } = body;
        
        if (!approvalId) {
            return NextResponse.json({ error: 'Missing approvalId' }, { status: 400 });
        }

        await PaymentRunEngine.approveRun(parseInt(approvalId, 10), userId || 'SYSTEM', comments);

        return NextResponse.json({ message: 'Approved successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
