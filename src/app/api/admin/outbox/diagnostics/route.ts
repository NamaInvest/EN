import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { OutboxService } from '@/lib/services/outbox.service';

export const GET = withRoute(async ({ prisma, tenant }) => {
    const diagnostics = await OutboxService.getDiagnostics(prisma, tenant);

    return NextResponse.json({
        ok: true,
        tenantAware: true,
        tenant,
        fetchedAt: new Date().toISOString(),
        diagnostics
    });
}, { rateLimit: 'ADMIN', roles: ['admin', 'owner', 'system_admin'] });
