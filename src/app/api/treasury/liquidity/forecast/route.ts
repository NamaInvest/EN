import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);

        const scenario = await prisma.liquidityScenario.findFirst({
            where: { tenantId, name: 'Base' }
        });

        if (!scenario) {
            return NextResponse.json({ forecasts: [], scenario: null });
        }

        const forecasts = await prisma.liquidityForecast.findMany({
            take: 100,
            where: { tenantId, scenarioId: scenario.id },
            orderBy: [{ weekNumber: 'asc' }, { category: 'asc' }]
        });

        return NextResponse.json({ forecasts, scenario });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
