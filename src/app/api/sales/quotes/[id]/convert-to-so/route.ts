import { NextRequest, NextResponse } from 'next/server';
import { QuoteEngine } from '@/lib/quote-engine';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const result = await QuoteEngine.convertToSalesOrder(parseInt(params.id, 10));
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
