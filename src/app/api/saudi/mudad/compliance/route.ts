import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Mudad Compliance API
 * GET  /api/saudi/mudad/compliance — Check compliance status
 * POST /api/saudi/mudad/compliance — Update employee status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkMudadCompliance, getUnprotectedEmployees, generateMudadReport } from '@/lib/mudad-compliance';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'saudi.mudad.compliance' });

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');

        if (view === 'unprotected') {
            const employees = await getUnprotectedEmployees(prisma);
            return NextResponse.json(employees);
        }

        if (view === 'report') {
            const month = req.nextUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7);
            const report = await generateMudadReport(prisma, month);
            return NextResponse.json(report);
        }

        const status = await checkMudadCompliance(prisma);
        return NextResponse.json(status);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
