import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { BICubeEngine } from '@/lib/bi-cube-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'kpi') {
            const kpi = await BICubeEngine.kpiSnapshot(prisma);
            return NextResponse.json(kpi);
        }
        const dims = (req.nextUrl.searchParams.get('dimensions') || 'TIME,PRODUCT').split(',') as any[];
        const result = await BICubeEngine.querySalesCube(prisma, {
            dimensions: dims,
            measures: ['REVENUE', 'QUANTITY'],
            limit: parseInt(req.nextUrl.searchParams.get('limit') || '50'),
        });
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
