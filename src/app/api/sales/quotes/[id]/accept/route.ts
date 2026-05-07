import { NextRequest, NextResponse } from 'next/server';
import { QuoteEngine } from '@/lib/quote-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    try {
        const result = await QuoteEngine.acceptQuote(parseInt((await params).id, 10));
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
