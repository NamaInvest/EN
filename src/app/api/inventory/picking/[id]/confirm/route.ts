import { NextRequest, NextResponse } from 'next/server';
import { WmsEngine } from '@/lib/wms-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json();
        const line = await WmsEngine.confirmPick(parseInt((await params).id, 10), body.actualBinId, body.actualQty);
        return NextResponse.json(line);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
