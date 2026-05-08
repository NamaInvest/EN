import { NextRequest, NextResponse } from 'next/server';
import { RmaEngine } from '@/lib/rma-engine';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json();
        const rma = await RmaEngine.requestRma(body);
        return NextResponse.json(rma);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
