import { NextRequest, NextResponse } from 'next/server';
import { LotEngine } from '@/lib/lot-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    try {
        const body = await req.json();
        const batch = await LotEngine.quarantineBatch(parseInt((await params).id, 10), body.reason || 'Manual quarantine');
        return NextResponse.json(batch);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
