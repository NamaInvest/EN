import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { ReorderEngine } from '@/lib/reorder-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'alerts') return NextResponse.json(await ReorderEngine.evaluate(prisma));
        return NextResponse.json(await ReorderEngine.getRules(prisma, user.tenantId));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'auto_po') return NextResponse.json(await ReorderEngine.autoCreatePOs(prisma));
        return NextResponse.json(await ReorderEngine.createRule(prisma, { ...body, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
