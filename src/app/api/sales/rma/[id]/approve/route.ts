import { NextRequest, NextResponse } from 'next/server';
import { RmaEngine } from '@/lib/rma-engine';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const rma = await RmaEngine.approveRma(parseInt(params.id, 10), body.approvedBy || 'System');
        return NextResponse.json(rma);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
