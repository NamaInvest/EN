import { NextRequest, NextResponse } from 'next/server';
import { MPSEngine } from '@/lib/mps-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const mps = await MPSEngine.generateMPS(body.period, body.demandData);
        return NextResponse.json(mps);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
