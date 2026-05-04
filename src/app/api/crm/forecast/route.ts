import { NextRequest, NextResponse } from 'next/server';
import { CRMEngine } from '@/lib/crm-engine';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ownerId = searchParams.get('ownerId') ? parseInt(searchParams.get('ownerId') as string, 10) : undefined;
        
        const forecast = await CRMEngine.forecastPipeline(ownerId);
        return NextResponse.json(forecast);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
