import { NextRequest, NextResponse } from 'next/server';
import { RmaEngine } from '@/lib/rma-engine';

export async function GET(req: NextRequest) {

    try {
        const url = new URL(req.url);
        const serialNumber = url.searchParams.get('serialNumber');
        if (!serialNumber) {
            return NextResponse.json({ error: 'Missing serialNumber' }, { status: 400 });
        }
        
        const claim = await RmaEngine.checkWarranty(serialNumber);
        return NextResponse.json(claim);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
