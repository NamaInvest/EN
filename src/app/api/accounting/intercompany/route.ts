import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { IntercompanyEngine } from '@/lib/intercompany-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');
    try {
        if (view === 'rules') return NextResponse.json(await IntercompanyEngine.getRules(prisma));
        if (view === 'balance') return NextResponse.json(await IntercompanyEngine.getBalance(prisma));
        return NextResponse.json(await IntercompanyEngine.getTransactions(prisma));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'create_rule') return NextResponse.json(await IntercompanyEngine.createRule(prisma, body));
        if (body.action === 'reconcile') return NextResponse.json(await IntercompanyEngine.reconcile(prisma, body.id));
        return NextResponse.json(await IntercompanyEngine.processInvoice(prisma, body));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
