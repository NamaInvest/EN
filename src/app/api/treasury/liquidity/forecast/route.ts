import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
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
            where: { tenantId, scenarioId: scenario.id },
            orderBy: [{ weekNumber: 'asc' }, { category: 'asc' }]
        });

        return NextResponse.json({ forecasts, scenario });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
