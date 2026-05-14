import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'master-panel-data' });
const prisma = new PrismaClient();

async function _GET(request: NextRequest) {
    const masterToken = request.cookies.get('master_token')?.value;
    const user = await getUserFromRequest(request as any);
    if (masterToken !== 'SECURE_MASTER_VALIDATED' && (!user || user.role !== 'owner')) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const tenants = await prisma.tenantAccount.findMany({
            orderBy: { id: 'desc' }
        });
        const companies = tenants.map((tenant: any) => ({
            ...tenant,
            name: tenant.orgName,
            companyId: tenant.id,
            subscriptions: [{
                status: (tenant.subscriptionStatus || tenant.status || '').toUpperCase(),
                endDate: tenant.trialEndsAt,
                planLabel: tenant.plan,
            }],
        }));
        return NextResponse.json({ tenants, companies });
    } catch (error: any) {
        log.error('Master Panel fetch error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
