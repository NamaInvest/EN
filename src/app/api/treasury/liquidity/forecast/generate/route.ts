import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        
        // 1. Create a base scenario if none exists
        let scenario = await prisma.liquidityScenario.findFirst({
            where: { tenantId, name: 'Base' }
        });

        if (!scenario) {
            scenario = await prisma.liquidityScenario.create({
                data: {
                    tenantId,
                    name: 'Base',
                    weights: { AR_INFLOW: 1.0, AP_OUTFLOW: 1.0, PAYROLL: 1.0, TAX: 1.0 },
                    createdBy: auth.userId.toString()
                }
            });
        }

        // 2. Clear old forecasts for this scenario for the current run
        // In a real system, you might version them. Here we just replace the Base.
        await prisma.liquidityForecast.deleteMany({
            where: { tenantId, scenarioId: scenario.id }
        });

        // 3. Generate 13-week forecast data
        const today = new Date();
        const forecasts = [];

        // Mocking the aggregation from AR/AP/Payroll due to complexity of joining various modules
        // Real implementation would group SalesInvoice by dueDate, PurchaseInvoice by dueDate, etc.
        
        for (let week = 1; week <= 13; week++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + (week * 7));

            // AR Inflow mock (e.g. decreasing probability over time)
            forecasts.push({
                tenantId,
                scenarioId: scenario.id,
                forecastDate,
                weekNumber: week,
                category: 'AR_INFLOW',
                expectedAmount: 500000 / week, 
            });

            // AP Outflow mock
            forecasts.push({
                tenantId,
                scenarioId: scenario.id,
                forecastDate,
                weekNumber: week,
                category: 'AP_OUTFLOW',
                expectedAmount: 200000 / week, 
            });

            // Payroll (Assume end of month, so roughly every 4 weeks)
            if (week % 4 === 0) {
                forecasts.push({
                    tenantId,
                    scenarioId: scenario.id,
                    forecastDate,
                    weekNumber: week,
                    category: 'PAYROLL',
                    expectedAmount: 850000, 
                });
            }
        }

        await prisma.liquidityForecast.createMany({
            data: forecasts
        });

        return NextResponse.json({ success: true, message: '13-Week Forecast Generated' });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
