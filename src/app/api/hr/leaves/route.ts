import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from '@/lib/api/with-route';
/**
 * Leave API Routes
 * GET  /api/hr/leaves — قائمة طلبات الإجازات
 * POST /api/hr/leaves — إنشاء طلب إجازة
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { LeaveEngine } from '@/lib/leave-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.leaves' });

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const tenantId = requireTenantId(req as any);

    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    const status = url.searchParams.get('status');
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    try {
        const where: any = { tenantId };
        if (employeeId) where.employeeId = parseInt(employeeId);
        if (status) where.status = status;
        where.startDate = {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31),
        };

        const requests = await (prisma as any).leaveRequest.findMany({ take: 100,
            where,
            include: { employee: { select: { id: true, name: true, position: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ requests, year });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في جلب طلبات الإجازات' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  leaveType: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.any().optional(),
  attachmentUrl: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    const tenantId = requireTenantId(req as any);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { employeeId, leaveType, startDate, endDate, reason, attachmentUrl } = body;

        if (!employeeId || !leaveType || !startDate || !endDate) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
        }

        const result = await LeaveEngine.submitLeaveRequest({
            employeeId: parseInt(employeeId),
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            attachmentUrl,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في إنشاء طلب الإجازة' }, { status: 400 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
