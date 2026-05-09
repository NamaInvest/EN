import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * PDPL Data Subject Request API
 * GET  /api/pdpl/dsr — Get pending DSR queue
 * POST /api/pdpl/dsr — Create new DSR
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createDSR, getDSRQueue, getOverdueDSRs } from '@/lib/pdpl-engine';
import { z } from 'zod';

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
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


const _POSTSchema = z.object({
  requestType: z.any().optional(),
  subjectType: z.any().optional(),
  subjectId: z.union([z.string(), z.number()]).optional(),
  subjectIdentifier: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (!body.requestType || !body.subjectType || !body.subjectId || !body.subjectIdentifier) {
            return NextResponse.json({ error: 'مطلوب: requestType, subjectType, subjectId, subjectIdentifier' }, { status: 400 });
        }
        const dsr = await createDSR(prisma, body);
        return NextResponse.json(dsr, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
