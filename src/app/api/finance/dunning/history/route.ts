import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { DunningEngine } from '@/lib/dunning-engine';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
        }

        const history = await DunningEngine.getDunningHistory(parseInt(customerId, 10));

        return NextResponse.json(history);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
