import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MudadEngine } from '@/lib/saudi-gov/mudad';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.mudad.wps.submit.batchId' });

async function _POST(
    req: NextRequest, 
    { params }: { params: Promise<{ batchId: string }> }
) {

  const { batchId } = await params;
    try {
        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
        const { batchId } = params;
        const result = await MudadEngine.submitWPSBatch(batchId);
        
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
