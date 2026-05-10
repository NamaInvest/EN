import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.governance-violations' });
async function _GET(request: NextRequest) {
    const auth = getUserFromRequest(request as any);
    if (!auth || auth.role !== 'admin') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const prisma = getPrisma(request as any);
    try {
        const violations = await prisma.auditLog.findMany({
            where: {
                action: 'GOVERNANCE_VIOLATION_ATTEMPT',
            },
            include: {
                user: { select: { username: true, fullName: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(violations);
    } catch (error: any) {
        log.error('Violations fetch error:', error);
        return NextResponse.json({ error: 'فشل في جلب المخالفات الرقابية' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
