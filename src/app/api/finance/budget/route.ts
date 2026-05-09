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

        const versions = await (prisma as any).budgetVersion.findMany({
            take: 100,
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { lines: true } } }
        });

        return NextResponse.json(versions);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = resolveTenant(request as any);

        const { action, ...data } = await request.json();

        if (action === 'create-version') {
            const version = await (prisma as any).budgetVersion.create({
                data: {
                    tenantId,
                    name: data.name,
                    fiscalYearId: data.fiscalYearId || 'FY-2026',
                    versionType: data.versionType || 'BUDGET',
                    status: 'DRAFT',
                    createdBy: auth.userId.toString()
                }
            });
            return NextResponse.json({ success: true, version });
        }

        if (action === 'add-line') {
            const line = await (prisma as any).budgetLine.create({
                data: {
                    tenantId,
                    versionId: data.versionId,
                    accountId: data.accountId,
                    costCenterId: data.costCenterId || null,
                    monthlyValues: data.monthlyValues || [0,0,0,0,0,0,0,0,0,0,0,0],
                    driverFormula: data.driverFormula || null,
                    notes: data.notes || null
                }
            });
            return NextResponse.json({ success: true, line });
        }

        if (action === 'lock') {
            await (prisma as any).budgetVersion.update({
                where: { id: data.versionId },
                data: { status: 'LOCKED' }
            });
            return NextResponse.json({ success: true, message: 'تم قفل الميزانية' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
