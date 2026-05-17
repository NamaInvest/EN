import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { InventoryService } from '@/lib/services/inventory.service';
import { ManufacturingService } from '@/lib/services/manufacturing.service';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'manufacturing.scrap' });

async function _GET(req: NextRequest, auth: any) {
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req as any);

    try {
        const wastages = await prisma.manufacturingWastage.findMany({ 
            take: 100,
            where: requireTenantFilter({ tenantId }),
            include: {
                order: true,
                rawProduct: true
            },
            orderBy: { reportedAt: 'desc' }
        });

        // Basic stats
        let totalWastedCost = 0;
        const reasonsCount: Record<string, number> = {};

        wastages.forEach(w => {
            totalWastedCost += n(w.wastedCost);
            const reason = w.reason || 'OTHER';
            reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
        });

        return NextResponse.json({ success: true, data: { wastages, stats: { totalWastedCost, reasonsCount } } });
    } catch (e: any) {
        log.error('manufacturing.scrap.GET', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  moId: z.union([z.string(), z.number()]).optional(),
  rawProductId: z.union([z.string(), z.number()]).optional(),
  lostQuantity: z.number().optional(),
  reason: z.any().optional(),
  wastagePhotoUrl: z.any().optional(),
  serialOrBatchNumber: z.any().optional(),
  stockId: z.number().optional(),
}).passthrough();

async function _POST(req: NextRequest, auth: any) {
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req as any);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { moId, rawProductId, lostQuantity, reason, wastagePhotoUrl, serialOrBatchNumber } = body;
        let stockId = body.stockId;

        // Verify MO and Product
        const mo = await prisma.manufacturingOrder.findFirst({ 
            where: { id: Number(moId), ...requireTenantFilter({ tenantId }) } 
        });
        const product = await prisma.product.findFirst({ 
            where: { id: Number(rawProductId), ...requireTenantFilter({ tenantId }) } 
        });

        if (!mo || !product) {
            return NextResponse.json({ error: 'MO or Product not found' }, { status: 404 });
        }

        // Default stock logic if not provided
        if (!stockId) {
            const firstStock = await prisma.stock.findFirst({ where: requireTenantFilter({ tenantId }) });
            if (!firstStock) throw new Error('No stock available for this tenant.');
            stockId = firstStock.id;
        }

        const wastedCost = n(product.buyPrice) * Number(lostQuantity);

        const reqId = req.headers.get('x-request-id') || Date.now().toString();
        const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || `mfg-scrap:${tenantId}:${mo.id}:${reqId}`;

        // Create wastage record directly
        const wastage = await prisma.manufacturingWastage.create({
            data: {
                tenantId,
                manufacturingOrderId: mo.id,
                rawProductId: product.id,
                lostQuantity: Number(lostQuantity),
                wastedCost: wastedCost,
                reason,
                wastagePhotoUrl,
                serialOrBatchNumber
            }
        });

        // Delegate inventory logic & Outbox emission to the dedicated service
        await ManufacturingService.postScrap(prisma as any, {
            tenantId,
            workOrderId: mo.id,
            scrapItems: [{
                productId: product.id,
                stockId: stockId,
                quantity: Number(lostQuantity)
            }],
            idempotencyKey
        });

        const result = wastage;

        // Optional: Auto-Journal if applicable (can be done asynchronously or explicitly via a Financial service)
        // Here we just log for now as the original code did.
        log.info(`[FINANCE] Auto-Journal created for Scrap. Dr 5910 / Cr 1310: ${wastedCost} SAR`, { tenantId });

        return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
        log.error('manufacturing.scrap.POST', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL' });

