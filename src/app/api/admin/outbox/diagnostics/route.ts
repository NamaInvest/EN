import { NextResponse } from 'next/server';
import { withGuard } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { OutboxService } from '@/lib/services/outbox.service';

export const GET = withGuard(async (req, params, user) => {
    // 1. Admin/Owner Guard
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    // 2. Tenant Guard
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req as any);

    // 3. Fetch read-only diagnostics
    // Note: getDiagnostics currently fetches system-wide stats for the connected prisma instance.
    // The oldestPendingEvent select does NOT include the payload, guaranteeing PII/PHI safety.
    const diagnostics = await OutboxService.getDiagnostics(prisma);

    return NextResponse.json({
        ok: true,
        tenantAware: !!tenantId,
        fetchedAt: new Date().toISOString(),
        diagnostics
    });
});
