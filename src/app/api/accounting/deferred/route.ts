import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { DeferralEngine } from '@/lib/deferral-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');
    try {
        if (view === 'pending') return NextResponse.json(await DeferralEngine.getPending(prisma, user.tenantId || ''));
        return NextResponse.json(await DeferralEngine.list(prisma, user.tenantId || ''));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'post_entry') return NextResponse.json(await DeferralEngine.postEntry(prisma, body.entryId));
        return NextResponse.json(await DeferralEngine.create(prisma, { ...body, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
