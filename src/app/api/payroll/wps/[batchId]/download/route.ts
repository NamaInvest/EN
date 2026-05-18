import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payroll.wps.batchId.download' });
async function _GET(
    request: Request,
    context: { params: Promise<{ batchId: string }> }
) {
    const prisma = getPrisma(request as any);

    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || !['admin', 'hr', 'hr_manager', 'payroll_admin'].includes(auth.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const tenantId = requireTenantId(request as any);
        const params = await context.params;
        const batchId = parseInt((await params).batchId);
        
        const batch = await prisma.wPSBatch.findFirst({
            where: { id: batchId, tenantId },
        });

        if (!batch || !batch.fileContent) {
            return NextResponse.json(
                { error: 'Batch not found or file not generated' },
                { status: 404 }
            );
        }

        const fileName = `WPS_${batch.batchNumber}.txt`;

        return new NextResponse(batch.fileContent, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Type': 'text/plain',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
