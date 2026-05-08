import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { QualityInspectionEngine } from '@/lib/quality-inspection-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'dashboard') return NextResponse.json(await QualityInspectionEngine.dashboard(prisma));
        const productId = req.nextUrl.searchParams.get('productId');
        return NextResponse.json(await QualityInspectionEngine.getHistory(prisma, productId ? parseInt(productId) : undefined));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'create_plan') return NextResponse.json(await QualityInspectionEngine.createPlan(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'record') return NextResponse.json(await QualityInspectionEngine.recordResult(prisma, { ...body, inspectedBy: (user as any).id, tenantId: (user as any).tenantId || '' }));
        return NextResponse.json({ error: 'action: create_plan | record' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
