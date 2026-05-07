import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { FinancialCloseEngine } from '@/lib/financial-close-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const period = req.nextUrl.searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const view = req.nextUrl.searchParams.get('view');
    try {
        if (view === 'progress') return NextResponse.json(await FinancialCloseEngine.getProgress(prisma, user.tenantId || '', period));
        return NextResponse.json(await FinancialCloseEngine.getChecklist(prisma, user.tenantId || '', period));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        return NextResponse.json(await FinancialCloseEngine.toggleItem(prisma, { ...body, userId: user.id, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
