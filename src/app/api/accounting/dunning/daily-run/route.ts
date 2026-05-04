import { NextRequest, NextResponse } from 'next/server';
import { DunningEngine } from '@/lib/dunning-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const date = body.date ? new Date(body.date) : new Date();
        
        await DunningEngine.executeDailyRun(date);
        
        return NextResponse.json({ message: 'Dunning daily run completed successfully', date });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
