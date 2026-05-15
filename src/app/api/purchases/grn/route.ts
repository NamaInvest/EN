import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/numbering';
import jwt from 'jsonwebtoken';
import { postGRN } from '@/lib/auto-journal';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'purchases/grn' });

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const grns = await prisma.goodsReceiptNote.findMany({ take: 100,
            include: {
                supplier: { select: { name: true } },
                order: { select: { orderNo: true } },
                receiver: { select: { fullName: true } },
                stock: { select: { name: true } },
                details: { include: { product: { select: { name: true, unit: true } } } }
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(grns);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  stockId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
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
        const { supplierId, orderId, stockId, notes, items } = body;

        const seqResult = await getNextNumber(prisma, 'GRN');
        const nextNo = seqResult.current;

        // P1: Fetch supplier name for auto-journal
        const supplierRecord = supplierId
            ? await prisma.customer.findUnique({ where: { id: parseInt(supplierId) }, select: { name: true } })
            : null;

        const grn = await runFinancialTx(prisma, async (tx: any) => {
            // P5: Status starts as 'pending_qc' — QC must approve before closing
            const newGrn = await tx.goodsReceiptNote.create({
                data: {
                    grnNo: nextNo,
                    supplierId: supplierId ? parseInt(supplierId) : null,
                    orderId: orderId ? parseInt(orderId) : null,
                    stockId: stockId ? parseInt(stockId) : 1,
                    notes,
                    receivedBy: decoded.userId,
                    status: 'pending_qc'
                },
            });

            let totalGrnCost = 0;

            for (const item of items) {
                const accepted = parseFloat(item.acceptedQty) || parseFloat(item.quantity);
                const rejected = parseFloat(item.rejectedQty) || 0;
                const productObj = await tx.product.findUnique({ where: { id: parseInt(item.productId) } });
                
                let createdBatchId = null;
                if (item.batchNumber && accepted > 0) {
                    const batch = await tx.productBatch.create({
                        data: {
                            productId: parseInt(item.productId),
                            batchNumber: item.batchNumber,
                            productionDate: item.productionDate ? new Date(item.productionDate) : null,
                            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                            initialQuantity: accepted,
                            currentQuantity: accepted,
                            unitCost: productObj?.buyPrice || 0
                        }
                    });
                    createdBatchId = batch.id;
                }

                await tx.goodsReceiptNoteDetail.create({
                    data: {
                        grnId: newGrn.id,
                        productId: parseInt(item.productId),
                        productName: item.productName,
                        quantity: parseFloat(item.quantity),
                        acceptedQty: accepted,
                        rejectedQty: rejected,
                        batchId: createdBatchId
                    }
                });

                if (accepted > 0) {
                    totalGrnCost += accepted * (productObj?.buyPrice || 0);

                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { currentStock: { increment: accepted } },
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            stockId: stockId ? parseInt(stockId) : 1,
                            type: 'in',
                            quantity: accepted,
                            referenceType: 'GRN',
                            referenceId: newGrn.id,
                            userId: decoded.userId,
                            notes: 'استلام بضاعة سند إدخال رقم ' + nextNo,
                            batchId: createdBatchId
                        },
                    });

                    // P2: Reorder point alert
                    const prod = await tx.product.findUnique({
                        where: { id: parseInt(item.productId) },
                        select: { name: true, currentStock: true, minStock: true },
                    });
                    if (prod?.minStock && prod.currentStock <= prod.minStock) {
                        await tx.systemAlert.create({
                            data: {
                                userId: decoded.userId,
                                title: `⚠️ مخزون منخفض: ${prod.name}`,
                                message: `المخزون الحالي ${prod.currentStock} وصل لحد إعادة الطلب (${prod.minStock}). يُنصح بإنشاء أمر شراء.`,
                                alertType: 'WARNING',
                                linkUrl: `/products/${parseInt(item.productId)}`,
                            },
                        }).catch(() => {});
                    }
                }
            }

            // P1: Auto-journal GRN with real supplier name
            if (totalGrnCost > 0) {
                try {
                    await postGRN({
                        grnNo: newGrn.grnNo,
                        totalCost: totalGrnCost,
                        supplierName: supplierRecord?.name || 'مورد',
                        userId: decoded.userId,
                        txClient: tx,
                    });
                } catch (je: unknown) {
                    log.error('Auto Journal Error (GRN):', je);
                }
            }

            // P5: Auto-create QualityInspection linked to this GRN
            await tx.qualityInspection.create({
                data: {
                    referenceNumber: `GRN-${nextNo}`,
                    inspectorId: decoded.userId,
                    status: 'PENDING',
                    notes: `فحص جودة تلقائي لسند الاستلام #${nextNo}`,
                    inspectionDate: new Date(),
                },
            }).catch(() => {});

            const { logAuditEvent } = await import('@/lib/audit-trail');
            await logAuditEvent(tx as any, {
                tenantId: req.headers.get('x-tenant') || 'default',
                userId: decoded.userId || null,
                action: 'CREATE',
                entityType: 'GoodsReceiptNote',
                entityId: newGrn.id,
                route: '/api/purchases/grn',
                newData: { grnNo: newGrn.grnNo, supplierId: newGrn.supplierId },
                ipAddress: req.headers.get('x-forwarded-for') || null,
            });

            return newGrn;
        });

        return NextResponse.json(grn);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header. Required for Purchases operations." }, { status: 400 });
    
    const isUnique = await lockIdempotencyKey(tenantString, 'purchase_grn', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    
    try {
        const response = await _POST(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'purchase_grn', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'purchase_grn', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'purchase_grn', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL' });
