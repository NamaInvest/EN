import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { WmsWavesService } from '@/lib/services/wms-waves.service';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'api.wms.waves' });

const _POSTSchema = z.object({
  action: z.enum(['slotting', 'plan_wave']).default('plan_wave'),
  warehouseId: z.coerce.number().optional().default(1),
  orderIds: z.array(z.number()).optional(),
  maxLines: z.number().max(200).optional().default(50),
});

async function _POST(req: NextRequest) {
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req);
    
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const payload = _parsed.data;
        log.info('WMS Wave API called', { tenantId, action: payload.action });

        if (payload.action === 'slotting') {
            // Read-only analysis
            const result = await WmsWavesService.getSlottingAnalysis(prisma, tenantId, payload.warehouseId);
            return NextResponse.json(result);
        }
        
        if (payload.action === 'plan_wave') {
            if (!payload.orderIds?.length) {
                return NextResponse.json({ error: 'مطلوب: orderIds[]' }, { status: 400 });
            }
            // Generate read-only preview (does not write to DB or change inventory)
            const wave = await WmsWavesService.generateWavePreview(
                prisma, 
                tenantId, 
                payload.warehouseId, 
                payload.orderIds, 
                payload.maxLines
            );
            return NextResponse.json(wave);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) { 
        log.error('WMS Wave API Error', { err: e });
        return NextResponse.json({ error: e.message }, { status: 500 }); 
    }
}

async function _GET(req: NextRequest) {
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req);
    
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        
        const waves = await WmsWavesService.listWaves(prisma, tenantId, { status });
        return NextResponse.json(waves);
    } catch (e: any) {
        log.error('WMS Wave List Error', { err: e });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
