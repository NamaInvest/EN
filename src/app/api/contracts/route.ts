import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { ContractEngine } from '@/lib/contract-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'summary') return NextResponse.json(await ContractEngine.summary(prisma));
        if (view === 'expiring') return NextResponse.json(await ContractEngine.getExpiring(prisma));
        return NextResponse.json(await ContractEngine.list(prisma, req.nextUrl.searchParams.get('status') || undefined));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'create') return NextResponse.json(await ContractEngine.create(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'renew') return NextResponse.json(await ContractEngine.renew(prisma, body.contractId, new Date(body.newEndDate), body.newValue));
        if (body.action === 'terminate') return NextResponse.json(await ContractEngine.terminate(prisma, body.contractId, body.reason));
        return NextResponse.json({ error: 'action: create | renew | terminate' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
