import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { WavePickingEngine } from '@/lib/wave-picking';

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'slotting') {
            const result = await WavePickingEngine.slottingAnalysis(prisma, body.warehouseId || 1);
            return NextResponse.json(result);
        }
        if (!body.orderIds?.length) return NextResponse.json({ error: 'مطلوب: orderIds[]' }, { status: 400 });
        const wave = await WavePickingEngine.planWave(prisma, body.warehouseId || 1, body.orderIds, body.maxLines || 50);
        return NextResponse.json(wave);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
