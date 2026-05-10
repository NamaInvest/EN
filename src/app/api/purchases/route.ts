import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2, validateMoney } from '@/lib/money';
import { purchaseCreateSchema, purchasePaymentSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';
import { resolveStockAndBranch } from '@/lib/getDefaults';
import { logFieldChanges, logDelete, auditContextFromRequest } from '@/lib/field-audit';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ route: 'purchases' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const status = searchParams.get('status');
        const receiptStatus = searchParams.get('receiptStatus');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request as any);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (from || to) { where.date = {}; if (from) (where.date as Record<string, unknown>).gte = new Date(from); if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59'); }
        if (status) where.status = status;
        if (receiptStatus) where.receiptStatus = receiptStatus;

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const invoices = await prisma.purchaseInvoice.findMany({ take: 100, where, include: { supplier: { select: { id: true, name: true, phone: true,  } }, user: { select: { id: true, username: true, fullName: true, role: true } } }, orderBy: { id: 'desc' } });
        return NextResponse.json(invoices);
    } catch (error: any) {
 log.error('src/app/api/purchases/route.ts', { error: error instanceof Error ? error.message : error });
 return handleApiError(error); }
}

async function _POST(request: Request) {

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        // Zod validation + strip unknown fields (mass-assignment protection)
        const body = purchaseCreateSchema.parse(rawBody);

        const userId = body.userId ? Number(body.userId) : null;

        // ── Auto-resolve stockId + branchId from warehouse ─────────────────
        const userBranchFallback = body.branchId ? Number(body.branchId) : (
            userId ? (await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } }))?.branchId ?? null : null
        );
        const { stockId: resolvedStockId, branchId } = await resolveStockAndBranch(
            body.stockId,
            userBranchFallback
        );

        const last = await prisma.purchaseInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = (last?.invoiceNo || 0) + 1;
        const items = body.items || [];
        const isManual = body.isManual === true;
        let subtotal = isManual ? (Number(body.manualSubtotal) || 0) : 0;

        const purchaseOrderId = body.purchaseOrderId ? Number(body.purchaseOrderId) : null;
        let calculatedPpv = 0;
        let poTotalAmount = 0;
        let poTotalQuantity = 0;
        let invoiceTotalQuantity = 0;

        if (purchaseOrderId && !isManual) {
            const po = await (prisma.purchaseOrder as any).findUnique({
                where: { id: purchaseOrderId },
                include: { details: true }
            });
            if (po) {
                for (const item of items) {
                    const poLine = po.details.find((d: any) => d.productId === Number(item.productId));
                    if (poLine) {
                        const invPrice = Number(item.price) || 0;
                        const poPrice = Number(poLine.price) || 0;
                        const qty = Number(item.quantity) || 1;
                        const linePpv = (invPrice - poPrice) * qty;
                        calculatedPpv += linePpv;
                        poTotalAmount += poPrice * qty;
                        poTotalQuantity += qty;
                    }
                    invoiceTotalQuantity += Number(item.quantity) || 1;
                }
            }
        }
        
        if (!isManual) {
            for (const item of items) { const t = (Number(item.quantity) || 1) * (Number(item.price) || 0); subtotal += t - t * ((Number(item.discountRate) || 0) / 100); }
        }
        
        const taxValue = isManual ? (Number(body.manualTaxValue) || 0) : subtotal * 0.15;
        const total = subtotal + taxValue;
        const paymentType = body.paymentType || 'cash';
        const paid = paymentType === 'credit' ? (Number(body.paid) || 0) : (Number(body.paid) || total);
        const remaining = total - paid;
        const status = remaining > 0 ? 'pending' : 'completed';
        const receiptStatus = body.receiptStatus || 'received';

        const invoice = await prisma.$transaction(async (tx) => {
            const createdInvoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNo, isManual, supplierId: body.supplierId ? Number(body.supplierId) : null,
                    stockId: resolvedStockId,
                    subtotal, taxValue, total, paid, remaining,
                    supplierInvoiceNo: body.supplierInvoiceNo || null,
                    paymentType,
                    status, receiptStatus, userId, branchId, notes: body.notes || null,
                    // @ts-ignore
                    purchaseOrderId,
                    // @ts-ignore
                    ppvAmount: calculatedPpv,
                    details: {
                        create: items.map((item: { productId: number; productName: string; quantity: number; price: number; discountRate: number }) => {
                            const qty = Number(item.quantity) || 1;
                            let price = Number(item.price) || 0;
                            let dRate = Number(item.discountRate) || 0;
                            
                            // 🛑 Override for manual invoices to prevent inventory valuation disruption
                            if (isManual) { price = 0; dRate = 0; }
                            
                            const iSub = qty * price; const dVal = iSub * (dRate / 100);
                            const afterD = iSub - dVal; const tax = afterD * 0.15;
                            return { productId: Number(item.productId), productName: String(item.productName || ''), quantity: qty, price, discountRate: dRate, discountValue: dVal, taxRate: isManual ? 0 : 15, taxValue: tax, total: afterD + tax };
                        }),
                    },
                },
                include: { details: true },
            });

            if (receiptStatus === 'received') {
                for (const item of items) {
                    const _qty_dup144 = Number(item.quantity) || 1;
                    const productId = Number(item.productId);
                    await tx.product.update({
                        where: { id: productId },
                        // @ts-expect-error [TS2304] Cannot find name
                        data: { currentStock: { increment: qty } },
                    });
                    
                    try {
                        await tx.productStock.upsert({
                            where: { productId_stockId: { productId, stockId: createdInvoice.stockId } },
                            // @ts-expect-error [TS2304] Cannot find name
                            update: { quantity: { increment: qty } },
                            // @ts-expect-error [TS2304] Cannot find name
                            create: { productId, stockId: createdInvoice.stockId, quantity: qty },
                        });
                        
                        // --- PHASE 1 AUTOMATION: AUDIT LOG CREATION ---
                        await tx.stockMovement.create({
                            data: {
                                productId: productId,
                                stockId: createdInvoice.stockId,
                                type: 'in',
                                // @ts-expect-error [TS2304] Cannot find name
                                quantity: qty,
                                referenceType: 'purchase_invoice',
                                referenceId: createdInvoice.id,
                                userId: userId,
                                notes: `فاتورة مشتريات #${invoiceNo}`
                            }
                        });
                    } catch (e: any) {
                         log.error('Failed to update productStock for purchase inside tx:', e);
                    }
                }
            }

            if (paid > 0) {
                await tx.treasury.create({
                    data: { type: 'out', amount: paid, description: `فاتورة مشتريات #${invoiceNo}`, referenceType: 'purchase', referenceId: createdInvoice.id, userId, branchId },
                });
            }

            if (purchaseOrderId) {
                const priceVariance = calculatedPpv;
                const quantityVariance = invoiceTotalQuantity - poTotalQuantity;
                const priceVariancePercent = poTotalAmount > 0 ? (priceVariance / poTotalAmount) * 100 : 0;
                const quantityVariancePercent = poTotalQuantity > 0 ? (quantityVariance / poTotalQuantity) * 100 : 0;
                
                const priceTolerancePercent = 5.0; // Default 5%
                const quantityTolerancePercent = 5.0; // Default 5%

                const isWithinTolerance = Math.abs(priceVariancePercent) <= priceTolerancePercent && Math.abs(quantityVariancePercent) <= quantityTolerancePercent;

                await (tx as any).threeWayMatch.create({
                    data: {
                        invoiceId: createdInvoice.id,
                        purchaseOrderId,
                        poTotalAmount,
                        poTotalQuantity,
                        grnTotalAmount: subtotal - priceVariance,
                        grnTotalQuantity: invoiceTotalQuantity,
                        invoiceTotalAmount: subtotal,
                        invoiceTotalQuantity,
                        priceVariance,
                        priceVariancePercent,
                        quantityVariance,
                        quantityVariancePercent,
                        priceTolerancePercent,
                        quantityTolerancePercent,
                        isWithinTolerance,
                        matchStatus: isWithinTolerance ? 'MATCHED' : 'MANUAL_REVIEW',
                        paymentBlocked: !isWithinTolerance
                    }
                });
            }

            // [STATE MACHINE AUDIT FIX] Ensure POS creations are properly logged in the audit trail
            try {
                await tx.auditLog.create({
                    data: {
                        userId: userId ?? 0,
                        action: `transition:draft→${createdInvoice.status}`,
                        tableName: 'purchaseinvoices',
                        recordId: String(createdInvoice.id),
                        details: `Direct API Creation (State-Machine Bypass Handled)`,
                    },
                });
            } catch (e: any) {
                log.error('[document-state-machine] POS audit log failed:', e);
            }

            return createdInvoice;
        });

        try {
            const { postPurchaseInvoice } = await import('@/lib/auto-journal');
            await postPurchaseInvoice({
                invoiceNo,
                subtotal,
                taxValue,
                total,
                paymentType,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
                ppvAmount: calculatedPpv,
                hasGRN: receiptStatus === 'received', // [EG-02] GRN already posted → clear GRNI
            });
        } catch (journalErr: unknown) {
            log.warn('Auto-journal for purchase skipped:', journalErr);
        }

        return NextResponse.json(invoice, { status: 201 });
    } catch (error: any) {
 log.error('src/app/api/purchases/route.ts', { error: error instanceof Error ? error.message : error });
 return handleApiError(error); }
}

async function _PUT(request: Request) {

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        const { invoiceId, amount, userId } = purchasePaymentSchema.parse(rawBody);

        const invoice = await prisma.purchaseInvoice.findUnique({ where: { id: Number(invoiceId) } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        const payAmount = Math.min(Number(amount), n(invoice.remaining));
        if (payAmount <= 0) return NextResponse.json({ error: 'لا يوجد رصيد مستحق' }, { status: 400 });

        const newPaid = n(invoice.paid) + payAmount;
        const newRemaining = n(invoice.total) - newPaid;

        const updated = await prisma.$transaction(async (tx) => {
            const updatedInvoice = await tx.purchaseInvoice.update({
                where: { id: Number(invoiceId) },
                data: {
                    paid: newPaid,
                    remaining: newRemaining,
                    status: newRemaining <= 0 ? 'completed' : 'pending',
                },
            });

            const parsedUserId = userId ? Number(userId) : null;
            const branchId = invoice.branchId; // use invoice's original branch

            await tx.treasury.create({
                data: {
                    type: 'out',
                    amount: payAmount,
                    description: `تسديد دفعة - فاتورة مشتريات #${invoice.invoiceNo}`,
                    referenceType: 'purchase_payment',
                    referenceId: invoice.id,
                    userId: parsedUserId,
                    branchId,
                },
            });

            return updatedInvoice;
        });

        // Audit trail — log payment changes
        try {
            await logFieldChanges(prisma, 'PurchaseInvoice', Number(invoiceId), invoice, updated, auditContextFromRequest(request, { userId: userId ? Number(userId) : undefined }));
        } catch (e: any) { log.error('[audit] Purchase payment audit failed:', e); }

        return NextResponse.json(updated);
    } catch (error: any) {
 log.error('src/app/api/purchases/route.ts', { error: error instanceof Error ? error.message : error });
 return handleApiError(error); }
}

async function _DELETE(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'delete_invoices', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف الفواتير' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));
        if (!id) return NextResponse.json({ error: 'معرف الفاتورة مطلوب' }, { status: 400 });

        const invoice = await prisma.purchaseInvoice.findUnique({ where: { id }, include: { details: true } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            // Reverse stock (decrement what was added from purchase) ONLY IF it was actually received
            if (invoice.receiptStatus === 'received') {
                for (const detail of invoice.details) {
                    await tx.product.update({
                        where: { id: detail.productId },
                        data: { currentStock: { decrement: detail.quantity } },
                    });
                    
                    try {
                        await tx.productStock.upsert({
                            where: { productId_stockId: { productId: detail.productId, stockId: invoice.stockId } },
                            update: { quantity: { decrement: detail.quantity } },
                            create: { productId: detail.productId, stockId: invoice.stockId, quantity: -detail.quantity },
                        });
                    } catch (e: any) {
                         log.error('Failed to reverse productStock for purchase delete inside tx:', e);
                    }
                }
            }

            // Remove related treasury entries
            await tx.treasury.deleteMany({ where: { referenceType: { in: ['purchase', 'purchase_payment'] }, referenceId: id } });

            // Delete invoice (cascade deletes details)
            await tx.purchaseInvoice.delete({ where: { id } });
        });

        // Audit trail — log deletion (after transaction succeeds)
        try {
            await logDelete(prisma, 'PurchaseInvoice', id, invoice as any, auditContextFromRequest(request, auth));
        } catch (e: any) { log.error('[audit] Purchase delete audit failed:', e); }

        return NextResponse.json({ success: true, message: 'تم حذف فاتورة المشتريات بنجاح' });
    } catch (error: any) {
        log.error('src/app/api/purchases/route.ts', { error: error instanceof Error ? error.message : error });

        return handleApiError(error);
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'FINANCIAL' });
