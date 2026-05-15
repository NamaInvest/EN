import { NextResponse, NextRequest } from 'next/server';
import { withGuard } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { runSystemReconciliation } from '@/lib/system-audit';

export const GET = withGuard(async (req, params, user) => {
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const prisma = getPrisma(req);
    
    const { summary, findings } = await runSystemReconciliation(prisma);

    return NextResponse.json({
        ok: summary.totalFindings === 0,
        checkedAt: new Date().toISOString(),
        summary,
        findings
    });
});
