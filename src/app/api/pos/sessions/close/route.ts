import { NextRequest, NextResponse } from 'next/server';
import { PosSessionEngine } from '@/lib/pos-session-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { sessionId, actualClosingCash, userId } = body;
        
        if (!sessionId || actualClosingCash === undefined) {
            return NextResponse.json({ error: 'sessionId and actualClosingCash are required' }, { status: 400 });
        }

        const session = await PosSessionEngine.closeSession(
            parseInt(sessionId, 10),
            parseFloat(actualClosingCash),
            userId || '1'
        );

        return NextResponse.json(session);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
