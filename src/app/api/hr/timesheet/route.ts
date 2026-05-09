import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { TimesheetEngine } from '@/lib/timesheet-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const empId = parseInt(req.nextUrl.searchParams.get('employeeId') || '0');
        const weekStart = req.nextUrl.searchParams.get('weekStart');
        if (empId && weekStart) {
            const grid = await TimesheetEngine.getWeekly(prisma, empId, new Date(weekStart));
            return NextResponse.json(grid);
        }
        const month = req.nextUrl.searchParams.get('month');
        if (month) {
            const summary = await TimesheetEngine.monthlySummary(prisma, month);
            return NextResponse.json({ summary });
        }
        return NextResponse.json({ error: 'employeeId+weekStart or month required' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'log') return NextResponse.json(await TimesheetEngine.logHours(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'submit') return NextResponse.json(await TimesheetEngine.submit(prisma, body.employeeId, new Date(body.weekStart)));
        if (body.action === 'approve') return NextResponse.json(await TimesheetEngine.approve(prisma, body.employeeId, new Date(body.weekStart)));
        return NextResponse.json({ error: 'action: log | submit | approve' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
