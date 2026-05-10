import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'admin.compliance' });
async function _GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const logs = await prisma.complianceAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Generate the 10 cross-cutting concerns matrix based on v2 Audit
        const concerns = [
            "Data Privacy & Masking",
            "Role-based Access Control (RBAC)",
            "ZATCA E-Invoicing Phase 2",
            "Multi-GAAP & IFRS Accounting",
            "Audit Trail & Immutability",
            "Localization & i18n",
            "Multi-Tenant & Data Isolation",
            "Disaster Recovery & Backups",
            "API Rate Limiting & Security",
            "Performance & SLA Tracking"
        ];

        return NextResponse.json({ success: true, logs, concerns });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'ADMIN' });
