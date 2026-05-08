import { NextRequest, NextResponse } from 'next/server';
import { PosSessionEngine } from '@/lib/pos-session-engine';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));
        const { userId, terminalId, branchId, openingFloat } = body;
        
        if (!userId || !terminalId) {
            return NextResponse.json({ error: 'userId and terminalId are required' }, { status: 400 });
        }

        const session = await PosSessionEngine.openSession(
            parseInt(userId, 10),
            parseInt(terminalId, 10),
            branchId ? parseInt(branchId, 10) : 1,
            parseFloat(openingFloat || 0)
        );

        return NextResponse.json(session);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
