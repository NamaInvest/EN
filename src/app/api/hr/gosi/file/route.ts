// @ts-nocheck
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { GOSIEngine } from '@/lib/gosi-engine';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.gosi.file' });
async function _GET(request: Request) {
    const prisma = getPrisma(request as any);
    const tenantId = requireTenantId(request as any);
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month'); // format YYYY-MM

    try {
        if (!monthStr) {
            // Return list of all GOSI files if no month specified
            const files = await prisma.gOSIMonthlyFile.findMany({ take: 100,
                where: { tenantId },
                orderBy: { month: 'desc' }
            });
            return NextResponse.json(files);
        }

        const [year, month] = monthStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, 1);

        // Check if file already exists
        let file = await prisma.gOSIMonthlyFile.findUnique({
            where: { month: dateObj, tenantId }
        });

        if (!file) {
            // Generate it on the fly if not exists
            const result = await GOSIEngine.generateMonthlyFile(dateObj); // Might need tenantId
            file = await prisma.gOSIMonthlyFile.findUnique({ where: { id: result.fileId, tenantId } });
        }

        return NextResponse.json(file);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
