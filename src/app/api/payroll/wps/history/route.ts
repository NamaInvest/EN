import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payroll.wps.history' });
async function _GET(request: Request) {
    const prisma = getPrisma(request as any);

    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || !['admin', 'hr', 'hr_manager', 'payroll_admin'].includes(auth.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const tenantId = requireTenantId(request as any);

        const batches = await prisma.wPSBatch.findMany({
            where: { tenantId },
            orderBy: {
                id: 'desc',
            },
            take: 50,
        });

        return NextResponse.json(batches);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
