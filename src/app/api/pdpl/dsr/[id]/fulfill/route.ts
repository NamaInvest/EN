import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * PDPL DSR Fulfill API
 * POST /api/pdpl/dsr/[id]/fulfill — Process a data subject request
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { fulfillAccess, eraseSubject } from '@/lib/pdpl-engine';

async function _POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const prisma = getPrisma(req);

    try {
        const body = await req.json().catch(() => ({}));
        const requestId = parseInt(id);

        // Determine type from DB
        const db = (p: any) => p as any;
        const dsr = await db(prisma).pdplDataSubjectRequest.findUnique({ where: { id: requestId } });
        if (!dsr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });

        let result;
        if (dsr.requestType === 'ACCESS' || dsr.requestType === 'PORTABILITY') {
            result = await fulfillAccess(prisma, requestId, (user as any).id || 1);
        } else if (dsr.requestType === 'ERASE') {
            result = await eraseSubject(prisma, requestId, (user as any).id || 1);
        } else {
            return NextResponse.json({ error: `نوع الطلب ${dsr.requestType} غير مدعوم بعد` }, { status: 400 });
        }

        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
