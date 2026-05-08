import { NextRequest, NextResponse } from 'next/server';
import { PaymentRunEngine } from '@/lib/payment-run-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();
        const { userId } = body;
        
        const runId = parseInt((await params).id, 10);
        const updatedRun = await PaymentRunEngine.submitForApproval(runId, userId || 'system');

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
