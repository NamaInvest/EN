import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';
import { getUserFromRequest } from '@/lib/auth';
import { postStockTransfer } from '@/lib/auto-journal';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'stock-transfers' });

const StockTransferItemSchema = z.object({
    productId:   z.union([z.string(), z.number()]).transform(v => parseInt(String(v))),
    productName: z.string().optional().nullable(),
    quantity:    z.union([z.string(), z.number()]).transform(v => parseFloat(String(v))),
});

const StockTransferSchema = z.object({
    fromStockId: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional().nullable(),
    toStockId:   z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional().nullable(),
    userId:      z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional().nullable(),
    notes:       z.string().optional().nullable(),
    items:       z.array(StockTransferItemSchema).min(1, 'يجب تحديد صنف واحد على الأقل للتحويل'),
});

async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const transfers = await prisma.stockTransfer.findMany({
            take: 100, include: { details: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(transfers);
    } catch (e: any) {
        return NextResponse.json([], { status: 500 });
    }
}

async function _POST(request: NextRequest) {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        const parsed  = StockTransferSchema.safeParse(rawBody);
        if (!parsed.success) {
            return apiError(
                { message: 'بيانات التحويل غير صالحة', errors: parsed.error.format() },
                'الرجاء التأكد من إدخال كافة حقول التحويل بشكل صحيح',
                { status: 400 }
            );
        }

        const body        = parsed.data;
        const last        = await prisma.stockTransfer.findFirst({ orderBy: { transferNo: 'desc' } });
        const transferNo  = (last?.transferNo || 0) + 1;
        const fromStockId = body.fromStockId ? Number(body.fromStockId) : null;
        const toStockId   = body.toStockId   ? Number(body.toStockId)   : null;
        const items       = body.items || [];

        // ── Stock Availability Check ─────────────────────────────────────────
        if (fromStockId && toStockId) {
            for (const item of items) {
                const src = await prisma.productStock.findUnique({
                    where: { productId_stockId: { productId: item.productId, stockId: fromStockId } }
                });
                if (!src || n(src.quantity) < item.quantity) {
                    return NextResponse.json(
                        { error: `الكمية المتاحة لـ "${item.productName}" غير كافية للتحويل.` },
                        { status: 400 }
                    );
                }
            }
        }

        // ── Transaction: Create Transfer + Update Stock ───────────────────────
        const transfer = await prisma.$transaction(async (tx) => {
            const tr = await tx.stockTransfer.create({
                data: {
                    transferNo,
                    fromStockId,
                    toStockId,
                    userId:  body.userId || null,
                    notes:   body.notes  || null,
                    details: {
                        create: items.map((item: any) => ({
                            productId:   item.productId,
                            productName: item.productName || '',
                            quantity:    item.quantity    || 0,
                        })),
                    },
                },
                include: { details: true },
            });

            if (fromStockId && toStockId) {
                for (const item of items) {
                    await tx.productStock.update({
                        where: { productId_stockId: { productId: item.productId, stockId: fromStockId } },
                        data:  { quantity: { decrement: item.quantity } }
                    });

                    const existingTarget = await tx.productStock.findUnique({
                        where: { productId_stockId: { productId: item.productId, stockId: toStockId } }
                    });

                    if (existingTarget) {
                        await tx.productStock.update({
                            where: { productId_stockId: { productId: item.productId, stockId: toStockId } },
                            data:  { quantity: { increment: item.quantity } }
                        });
                    } else {
                        await tx.productStock.create({
                            data: { productId: item.productId, stockId: toStockId, quantity: item.quantity }
                        });
                    }
                }
            }
            return tr;
        });

        // ── Auto-Journal: قيد تحويل مخزون ───────────────────────────────────
        if (fromStockId && toStockId && items.length > 0) {
            const firstName = items[0]?.productName || 'بضاعة محولة';
            const totalQty  = (items as any[]).reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0);
            const totalCost = (items as any[]).reduce((s: number, i: any) => {
                const unitCost = Number(i.unitCost || i.avgCost || i.costPrice || 0);
                return s + (unitCost * Number(i.quantity || 0));
            }, 0);
            postStockTransfer({
                movementId:  transfer.id,
                reference:   `STK-${transferNo}`,
                type:        'transit_out',
                totalCost:   totalCost > 0 ? totalCost : totalQty,
                productName: firstName,
                userId:      auth.userId,
                date:        new Date().toISOString().split('T')[0],
            }).catch(err => log.error('auto-journal stock-transfer', { msg: err.message }));
        }

        return NextResponse.json(transfer, { status: 201 });
    } catch (e: any) {
        log.error('Transfer Error:', e);
        return NextResponse.json({ error: e.message || 'فشل إنشاء التحويل' }, { status: 500 });
    }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT'   });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
