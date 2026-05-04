import { NextRequest, NextResponse } from 'next/server';
import { DunningEngine } from '@/lib/dunning-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const asOfDate = body.asOfDate ? new Date(body.asOfDate) : new Date();
        
        const results = await DunningEngine.runDunningCron(asOfDate);

        return NextResponse.json({ success: true, count: results.length, runs: results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
