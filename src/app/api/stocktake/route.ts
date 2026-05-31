import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';

const log = logger.child({ service: 'stocktake' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(request as any);
        const stocktakes = await prisma.stocktake.findMany({ take: 100,
            where: { tenantId },
            include: { items: true },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(stocktakes);
    } catch (e: any) { log.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(request as any);
        const auth = getUserFromRequest(request as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const overrideContext = buildOverrideContextFromRequest(request as any, {
            tenantId,
            actorId: String(auth?.userId || body.userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        // ── Period Lock Enforcement ────────────────────────────────────────
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate: new Date(),
                operationType: 'STOCKTAKE',
                module: 'inventory',
                actor: String(auth?.userId || body.userId || 'SYSTEM'),
                overrideContext
            });
        } catch (err) {
            if (err instanceof PeriodLockViolation) {
                return NextResponse.json({
                    error: err.message,
                    code: err.code
                }, { status: err.code === 'LOCKED' ? 409 : 422 });
            }
            throw err;
        }
        // ────────────────────────────────────────────────────────────────────

        const products = await prisma.product.findMany({ take: 100, where: { active: true, tenantId }, select: { id: true, name: true, currentStock: true, buyPrice: true } });

        const items = (body.items || []).map((item: { productId: number; actualQty: number }) => {
            const product = products.find(p => p.id === item.productId);
            const systemQty = n(product?.currentStock || 0);
            const diff = item.actualQty - systemQty;
            return {
                productId: item.productId,
                systemQty,
                actualQty: item.actualQty,
                difference: diff,
                status: diff === 0 ? 'matched' : diff > 0 ? 'over' : 'short',
            };
        });

        const matched = items.filter((i: { status: string }) => i.status === 'matched').length;
        const over = items.filter((i: { status: string }) => i.status === 'over').length;
        const short = items.filter((i: { status: string }) => i.status === 'short').length;

        const result = await runInventoryTx(prisma, async (tx: any) => {
            const stocktake = await tx.stocktake.create({
                data: {
                    tenantId,
                    stocktakeDate: new Date().toISOString().split('T')[0],
                    totalItems: items.length, matched, over, short,
                    status: body.applyAdjustment ? 'applied' : 'completed',
                    notes: body.notes || null,
                    createdBy: body.userId || null,
                    items: { create: items },
                },
                include: { items: true },
            });

            // Apply stock adjustment if requested
            if (body.applyAdjustment) {
                const targetStockId = body.stockId ? parseInt(body.stockId) : 1;
                
                // Need auto-journal import locally if not at top level
                const { postInventoryAdjustment } = await import('@/lib/auto-journal');

                for (const item of items) {
                    if (item.difference !== 0) {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) continue;

                        await tx.product.updateMany({
                            where: { id: item.productId, tenantId },
                            data: { currentStock: item.actualQty },
                        });

                        const pStock = await tx.productStock.findFirst({ where: { productId: item.productId, stockId: targetStockId, tenantId } });
                        if (pStock) {
                            await tx.productStock.updateMany({
                                where: { productId: item.productId, stockId: targetStockId, tenantId },
                                data: { quantity: { increment: item.difference } }
                            });
                        } else {
                            await tx.productStock.create({
                                data: { tenantId, productId: item.productId, stockId: targetStockId, quantity: item.difference }
                            });
                        }

                        await tx.stockMovement.create({
                            data: {
                                tenantId,
                                productId: item.productId,
                                stockId: targetStockId,
                                type: item.difference > 0 ? 'adjustment_in' : 'adjustment_out',
                                quantity: Math.abs(item.difference),
                                referenceType: 'Stocktake',
                                referenceId: stocktake.id,
                                userId: body.userId || null,
                                notes: `تسوية جردية (Stocktake #${stocktake.id}): من ${item.systemQty} إلى ${item.actualQty}`
                            }
                        });

                        const diffCost = item.difference * (n((product as any).buyPrice) || 0);
                        if (diffCost !== 0) {
                            await postInventoryAdjustment({
                                productId: item.productId,
                                diffCost: diffCost,
                                reason: `تسوية جردية رقم #${stocktake.id}`,
                                userId: body.userId,
                                txClient: tx
                            });
                        }
                    }
                }
            }
            return stocktake;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (e: any) { log.error('Stocktake error:', e); return NextResponse.json({ error: 'فشل في إنشاء الجرد' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
