import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from '@/lib/api/with-route';
/**
 * Leave Balance API
 * GET /api/hr/leaves/balance?employeeId=X — رصيد إجازات الموظف
 */
import { NextResponse } from 'next/server';
import { LeaveEngine } from '@/lib/leave-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.leaves.balance' });

async function _GET(req: Request) {
    const tenantId = requireTenantId(req as any);

    const url = new URL(req.url);
    const employeeId = parseInt(url.searchParams.get('employeeId') || '0');
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    if (!employeeId) {
        return NextResponse.json({ error: 'employeeId مطلوب' }, { status: 400 });
    }

    try {
        const summary = await LeaveEngine.getEmployeeLeaveSummary(employeeId, year);
        return NextResponse.json(summary);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
