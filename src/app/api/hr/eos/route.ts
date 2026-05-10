import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * EOS (End of Service) API Routes
 * GET  /api/hr/eos — قائمة تسويات نهاية الخدمة
 * POST /api/hr/eos — حساب تسوية جديدة
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { SaudiEOSEngine, EOSReason } from '@/lib/saudi-eos-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.eos' });

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const employeeId = url.searchParams.get('employeeId');

        const where: any = {};
        if (status) where.status = status;
        if (employeeId) where.employeeId = parseInt(employeeId);

        const calculations = await prisma.endOfServiceCalculation.findMany({ take: 100,
            where,
            include: { employee: { select: { id: true, name: true, position: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ calculations });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في جلب تسويات نهاية الخدمة' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  endDate: z.string().optional(),
  reason: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { employeeId, endDate, reason } = body;

        if (!employeeId || !endDate || !reason) {
            return NextResponse.json({ error: 'بيانات ناقصة: employeeId, endDate, reason' }, { status: 400 });
        }

        const result = await SaudiEOSEngine.calculate(
            parseInt(employeeId),
            new Date(endDate),
            reason as EOSReason
        );

        const draft = await SaudiEOSEngine.saveDraft(result);

        return NextResponse.json({ success: true, calculation: result, draftId: draft.id });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في حساب نهاية الخدمة' }, { status: 400 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
