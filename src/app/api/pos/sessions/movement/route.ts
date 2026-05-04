import { NextRequest, NextResponse } from 'next/server';
import { PosSessionEngine } from '@/lib/pos-session-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { sessionId, type, amount, reason } = body;
        
        if (!sessionId || !type || !amount) {
            return NextResponse.json({ error: 'sessionId, type, and amount are required' }, { status: 400 });
        }

        const movement = await PosSessionEngine.addMovement(
            parseInt(sessionId, 10),
            type,
            parseFloat(amount),
            reason
        );

        return NextResponse.json(movement);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
