import { NextRequest, NextResponse } from 'next/server';
import { LotEngine } from '@/lib/lot-engine';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '90', 10);
        const batches = await LotEngine.getExpiringBatches(days);
        return NextResponse.json(batches);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
