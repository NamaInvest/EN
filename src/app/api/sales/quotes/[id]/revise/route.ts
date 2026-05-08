import { NextRequest, NextResponse } from 'next/server';
import { QuoteEngine } from '@/lib/quote-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const body = await req.json().catch(() => ({}));
        const { changes, userId } = body;

        const result = await QuoteEngine.reviseQuote(parseInt((await params).id, 10), changes, userId);

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
