import { NextRequest, NextResponse } from 'next/server';
import { LotEngine } from '@/lib/lot-engine';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const batch = await LotEngine.recallBatch(parseInt(params.id, 10), body.reason || 'Recall');
        return NextResponse.json(batch);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
