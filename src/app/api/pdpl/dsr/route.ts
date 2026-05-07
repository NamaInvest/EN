/**
 * PDPL Data Subject Request API
 * GET  /api/pdpl/dsr — Get pending DSR queue
 * POST /api/pdpl/dsr — Create new DSR
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createDSR, getDSRQueue, getOverdueDSRs } from '@/lib/pdpl-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const includeOverdue = req.nextUrl.searchParams.get('overdue') === 'true';
        if (includeOverdue) {
            const overdue = await getOverdueDSRs(prisma);
            return NextResponse.json({ overdue, alert: overdue.length > 0 ? `⚠️ ${overdue.length} طلبات متأخرة — غرامة PDPL` : null });
        }
        const queue = await getDSRQueue(prisma);
        return NextResponse.json(queue);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (!body.requestType || !body.subjectType || !body.subjectId || !body.subjectIdentifier) {
            return NextResponse.json({ error: 'مطلوب: requestType, subjectType, subjectId, subjectIdentifier' }, { status: 400 });
        }
        const dsr = await createDSR(prisma, body);
        return NextResponse.json(dsr, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
