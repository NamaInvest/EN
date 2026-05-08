import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ExpenseReportEngine } from '@/lib/expense-report-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const id = req.nextUrl.searchParams.get('id');
    try {
        if (id) return NextResponse.json(await ExpenseReportEngine.getById(prisma, parseInt(id)));
        return NextResponse.json(await ExpenseReportEngine.list(prisma, user.tenantId || ''));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'submit') return NextResponse.json(await ExpenseReportEngine.submit(prisma, body.id));
        if (body.action === 'approve') return NextResponse.json(await ExpenseReportEngine.approve(prisma, body.id, user.id));
        if (body.action === 'reject') return NextResponse.json(await ExpenseReportEngine.reject(prisma, body.id));
        return NextResponse.json(await ExpenseReportEngine.create(prisma, { ...body, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
