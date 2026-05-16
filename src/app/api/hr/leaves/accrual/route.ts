import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Leave Accrual API
 * POST /api/hr/leaves/accrual — تشغيل التجميع الشهري
 * GET  /api/hr/leaves/accrual — حالة التجميع
 */
import { NextResponse } from 'next/server';
import { LeaveEngine } from '@/lib/leave-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.leaves.accrual' });


const _POSTSchema = z.object({
  date: z.string().optional(),
}).passthrough();

async function _POST(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const accrualDate = body.date ? new Date(body.date) : new Date();
        const result = await LeaveEngine.runMonthlyAccrual(accrualDate, user.userId);
        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في التجميع الشهري' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
