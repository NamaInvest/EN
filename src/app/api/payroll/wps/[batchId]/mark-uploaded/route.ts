import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { WPSGenerator } from '@/lib/wps-generator';
import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payroll.wps.batchId.mark-uploaded' });

async function _POST(
    request: Request,
    context: { params: Promise<{ batchId: string }> }
) {
    const prisma = getPrisma(request as any);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || !['admin', 'hr', 'hr_manager', 'payroll_admin'].includes(auth.role)) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        }
        const tenantId = requireTenantId(request as any);
        const params = await context.params;
        const batchId = parseInt(params.batchId);
        
        await WPSGenerator.submitToBank(prisma, tenantId, batchId);

        return NextResponse.json({
            message: 'Batch marked as uploaded successfully',
        });
    } catch (error: any) {
        log.error('Mark uploaded error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
