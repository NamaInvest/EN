import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.three-way-match' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const matches = await (prisma as any).threeWayMatch.findMany({ take: 100,
            include: {
                invoice: { select: { invoiceNo: true, total: true, supplier: { select: { name: true } } } },
                purchaseOrder: { select: { orderNo: true, total: true } },
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(matches);
    } catch (error: any) {
        log.error('ThreeWayMatch GET error:', error);
        return NextResponse.json({ error: 'فشل جلب بيانات المطابقة' }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  matchId: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { matchId, status, notes } = body; // status: 'approved' | 'rejected'

        if (!matchId || !status) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
        }

        const match = await (prisma as any).threeWayMatch.update({
            where: { id: matchId },
            data: { matchStatus: status }
        });

        return NextResponse.json({ success: true, match });
    } catch (error: any) {
        log.error('ThreeWayMatch PUT error:', error);
        return NextResponse.json({ error: 'فشل تحديث حالة المطابقة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'FINANCIAL' });
