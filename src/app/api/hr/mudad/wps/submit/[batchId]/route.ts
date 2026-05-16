import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MudadEngine } from '@/lib/saudi-gov/mudad';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.mudad.wps.submit.batchId' });

async function _POST(
    req: NextRequest, 
    { params }: { params: Promise<{ batchId: string }> }
) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req);

  const { batchId } = await params;
    try {
        const result = await MudadEngine.submitWPSBatch(prisma, batchId, tenantId);
        
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
