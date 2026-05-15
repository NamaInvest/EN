import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { postPurchaseReturn } from '@/lib/auto-journal';
import { purchaseReturnCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';
import { withIdempotency } from '@/lib/idempotency';

const log = logger.child({ service: 'purchase-returns' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const returns = await prisma.purchaseReturn.findMany({ take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(returns);
    } catch (e: any) {
 log.error('src/app/api/purchase-returns/route.ts', { error: e instanceof Error ? e.message : e });
 return handleApiError(e); }
}

async function _POST(request: NextRequest, auth: any, tenantId: string) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json().catch(() => ({}));
        // Zod runtime validation + mass-assignment protection
        const body = purchaseReturnCreateSchema.parse(rawBody);

        const userId = auth?.userId ? Number(auth.userId) : null;
        let branchId = body.branchId ? Number(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        // Validate original invoice exists
        let stockIdTarget = null;
        if (body.originalInvoiceId) {
            const originalInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: Number(body.originalInvoiceId) }
            });
            if (!originalInvoice) {
                return NextResponse.json({ error: 'الفاتورة الأصلية غير موجودة' }, { status: 404 });
            }
            stockIdTarget = originalInvoice.stockId;
        }

        const details = rawBody.details || [];
        if (details.length === 0) {
            return NextResponse.json({ error: 'تفاصيل المرتجع مطلوبة' }, { status: 400 });
        }

        const last = await prisma.purchaseReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;
        
        const subtotal = details.reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.price || 0)), 0);
        const taxRate = details[0]?.taxRate || 15;
        const taxValue = subtotal * (taxRate / 100);
        const total = subtotal + taxValue;

        // Atomic transaction: create return AND treasury entry together
        const ret = await runFinancialTx(prisma, async (tx: any) => {
            const newReturn = await tx.purchaseReturn.create({
                data: {
                    returnNo,
                    originalInvoiceId: body.originalInvoiceId ? Number(body.originalInvoiceId) : null,
                    supplierId: body.supplierId ? Number(body.supplierId) : null,
                    subtotal, taxValue, total,
                    userId, notes: body.notes || null,
                    details: {
                        create: details.map((item: any) => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            taxRate: taxRate,
                            taxValue: (item.quantity * item.price) * (taxRate / 100),
                            total: (item.quantity * item.price) * (1 + taxRate / 100)
                        }))
                    }
                },
            });

            // Update inventory
            for (const item of details) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: { decrement: item.quantity } }
                });

                if (stockIdTarget) {
                    await (tx as any).productStock.update({
                        where: { productId_stockId: { productId: item.productId, stockId: stockIdTarget } },
                        data: { quantity: { decrement: item.quantity } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            stockId: stockIdTarget,
                            type: 'out',
                            quantity: item.quantity,
                            referenceType: 'purchase_return',
                            referenceId: newReturn.id,
                            userId: userId || null,
                            notes: `مرتجع مشتريات #${returnNo}`
                        }
                    });
                }
            }

            if (n(newReturn.total) > 0) {
                const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                await TreasuryPostingService.createTreasuryEntry(tx, {
                    type: 'in', amount: newReturn.total,
                    description: `مرتجع مشتريات #${returnNo}`,
                    referenceType: 'purchase_return', referenceId: newReturn.id,
                }, userId, branchId);
            }

            await postPurchaseReturn({
                returnNo: newReturn.returnNo,
                subtotal: n(newReturn.subtotal),
                taxValue: n(newReturn.taxValue),
                total: n(newReturn.total),
                paymentType: 'cash', // Or read from body if provided
                userId: newReturn.userId || undefined,
                branchId: branchId || undefined,
                txClient: tx
            });

            return newReturn;
        });

        return NextResponse.json(ret, { status: 201 });
    } catch (e: any) {
 log.error('src/app/api/purchase-returns/route.ts', { error: e instanceof Error ? e.message : e });
 return handleApiError(e); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => {
    const { withIdempotency } = await import('@/lib/idempotency');
    const tenantId = req.headers.get('x-tenant-id') || 'public';
    return withIdempotency(req as NextRequest, 'POST /api/purchase-returns', async () => _POST(req as any, auth, tenantId as string));
}, { rateLimit: 'FINANCIAL' });
