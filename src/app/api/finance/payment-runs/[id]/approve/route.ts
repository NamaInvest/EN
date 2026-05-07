import { NextRequest, NextResponse } from 'next/server';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
