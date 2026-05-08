import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { lineId, targetType, targetId } = body;

        if (!lineId || !targetType || !targetId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const line = await prisma.bankStatementLine.update({
            where: { id: parseInt(lineId, 10) },
            data: {
                matchStatus: 'MANUAL_MATCHED',
                matchedToType: targetType,
                matchedToId: parseInt(targetId, 10),
                matchedAt: new Date()
            }
        });

        return NextResponse.json({ message: 'Matched successfully', line });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
