import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import jwt from 'jsonwebtoken';
import { postInventoryAdjustment } from '@/lib/auto-journal';
import { getUserFromRequest } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runInventoryTx } from '@/lib/db/transaction';
import { FinancialPeriodService } from '@/services/accounting/financial-period.service';
import { DEFAULT_STOCK_ADJUSTMENT_TOLERANCE } from '@/app/api/adjustments/route';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';

const log = logger.child({ service: 'stock.adjustments' });

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        // Get past adjustments
        const tenantId = requireTenantId(req as any);
        const adjustments = await prisma.stockMovement.findMany({ take: 100,
            where: {
                tenantId,
                type: { in: ['adjustment', 'adjustment_in', 'adjustment_out'] }
            },
            include: {
                product: { select: { name: true, } },
                user: { select: { fullName: true } }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(adjustments);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  actualQuantity: z.number().optional(),
  reason: z.any().optional(),
  stockId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);

    // Auth guard
    const _auth = getUserFromRequest(req as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { productId, actualQuantity, reason, stockId } = body;

        if (!productId || actualQuantity === undefined) {
            return NextResponse.json({ error: 'المعلومات غير مكتملة' }, { status: 400 });
        }

        const tenantId = requireTenantId(req as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const overrideContext = buildOverrideContextFromRequest(req as any, {
            tenantId,
            actorId: String(_auth?.userId || decoded.userId || '0'),
            actorRole: _auth?.role || 'USER'
        });

        // ── Period Lock Enforcement ────────────────────────────────────────
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate: new Date(),
                operationType: 'STOCK_ADJUSTMENT',
                module: 'inventory',
                actor: String(_auth?.userId || decoded.userId || 'SYSTEM'),
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

        const adjustment = await runInventoryTx(prisma, async (tx: any) => {

            const product = await tx.product.findFirst({ where: { id: parseInt(productId), tenantId } });
            if (!product) throw new Error('المنتج غير موجود');

            const current = n(product.currentStock);
            const diff = parseFloat(actualQuantity) - current;

            if (diff === 0) throw new Error('لا يوجد فارق لتسويته! الرصيد الفعلي يطابق الدفتري.');

            const diffCost = diff * (n(product.buyPrice) || 0);

            // Check Stock Adjustment Tolerance Guardrail
            const absVariance = Math.abs(diffCost);
            if (absVariance > DEFAULT_STOCK_ADJUSTMENT_TOLERANCE) {
                const isAuthorized = _auth?.role === 'admin' || _auth?.role === 'owner';
                if (!isAuthorized) {
                    throw new Error(`STOCK_ADJUSTMENT_TOLERANCE_EXCEEDED: تجاوز حد تسوية الجرد المسموح به — قيمة التسوية الحالية ${absVariance.toFixed(2)} ر.س تتجاوز الحد المعتمد ${DEFAULT_STOCK_ADJUSTMENT_TOLERANCE.toFixed(2)} ر.س للمستودعات. تتطلب موافقة المدير المالي أو المالك.`);
                }
            }

            const targetStockId = stockId ? parseInt(stockId) : 1;

            await tx.product.updateMany({
                where: { id: product.id, tenantId },
                data: { currentStock: parseFloat(actualQuantity) }
            });

            // Upsert ProductStock for warehouse balance
            await (tx as any).productStock.upsert({
                where: { productId_stockId: { productId: product.id, stockId: targetStockId } },
                create: { productId: product.id, stockId: targetStockId, quantity: diff },
                update: { quantity: { increment: diff } }
            });

            // Log adjustment
            const mov = await tx.stockMovement.create({
                data: {
                    tenantId,
                    productId: product.id,
                    stockId: targetStockId,
                    type: diff > 0 ? 'adjustment_in' : 'adjustment_out',
                    quantity: Math.abs(diff),
                    referenceType: 'PhysicalCount',
                    userId: decoded.userId,
                    notes: 'تسوية رصيد: من ' + current + ' إلى ' + actualQuantity + '. السبب: ' + (reason || 'تسوية يدوية')
                }
            });

            // Post to Auto Journal
            if (diffCost !== 0) {
                await postInventoryAdjustment({
                    productId: product.id,
                    diffCost: diffCost,
                    reason: reason || 'تسوية جردية يدوية',
                    userId: decoded.userId,
                    txClient: tx
                });
            }

            return mov;
        });

        return NextResponse.json(adjustment);
    } catch (e: any) {
        log.error(e);
        if (e.message && e.message.startsWith('STOCK_ADJUSTMENT_TOLERANCE_EXCEEDED')) {
            const parts = e.message.split(': ');
            return NextResponse.json({
                success: false,
                error: parts[1] || e.message,
                code: 'STOCK_ADJUSTMENT_TOLERANCE_EXCEEDED'
            }, { status: 400 });
        }
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 400 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
