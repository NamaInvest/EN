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
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';
import { reverseJournalByReference } from '@/lib/auto-journal';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { assertEditable } from '@/lib/document-state-machine';
import { getNextNumber } from '@/lib/numbering';
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
        const tenantId = requireTenantId(request as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const auth = getUserFromRequest(request as any);
        const overrideContext = buildOverrideContextFromRequest(request as any, {
            tenantId,
            actorId: String(auth?.userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        // ── Auto-resolve stockId + branchId from warehouse ─────────────────
        const userBranchFallback = body.branchId ? Number(body.branchId) : (
            userId ? (await prisma.user.findFirst({ where: { id: userId, tenantId }, select: { branchId: true } }))?.branchId ?? null : null
        );
        const { stockId: resolvedStockId, branchId } = await resolveStockAndBranch(
            body.stockId,
            userBranchFallback
        );

        // invoiceNo is generated inside the financial transaction to prevent concurrency conflicts
        const items = body.items || [];
        const isManual = body.isManual === true;
        let subtotal = isManual ? (Number(body.manualSubtotal) || 0) : 0;

        const purchaseOrderId = body.purchaseOrderId ? Number(body.purchaseOrderId) : null;
        let calculatedPpv = 0;
        let poTotalAmount = 0;
        let poTotalQuantity = 0;
        let invoiceTotalQuantity = 0;

        if (purchaseOrderId && !isManual) {
            const po = await (prisma.purchaseOrder as any).findFirst({
                where: { id: purchaseOrderId, tenantId },
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

        const invoice = await runFinancialTx(prisma, async (tx: any) => {
            let finalInvoiceNo: number;
            if (isManual && body.supplierInvoiceNo) {
                finalInvoiceNo = Number(body.supplierInvoiceNo) || 1;
            } else {
                const seqResult = await getNextNumber(tx, 'PI', branchId);
                finalInvoiceNo = seqResult.current;
            }

            const createdInvoice = await tx.purchaseInvoice.create({
                data: {
                    tenantId,
                    invoiceNo: finalInvoiceNo, isManual, supplierId: body.supplierId ? Number(body.supplierId) : null,
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
                    const qty = Number(item.quantity) || 1;
                    const productId = Number(item.productId);
                    await tx.product.updateMany({
                        where: { id: productId, tenantId },
                        data: { currentStock: { increment: qty } },
                    });
                    
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId, stockId: createdInvoice.stockId } },
                        update: { quantity: { increment: qty } },
                        create: { productId, stockId: createdInvoice.stockId, quantity: qty },
                    });
                    
                    // --- PHASE 1 AUTOMATION: AUDIT LOG CREATION ---
                    await tx.stockMovement.create({
                        data: {
                            tenantId,
                            productId: productId,
                            stockId: createdInvoice.stockId,
                            type: 'in',
                            quantity: qty,
                            referenceType: 'purchase_invoice',
                            referenceId: createdInvoice.id,
                            userId: userId,
                            notes: `فاتورة مشتريات #${finalInvoiceNo}`
                        }
                    });
                }
            }

            if (paid > 0) {
                const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                await TreasuryPostingService.createTreasuryEntry(tx, { type: 'out', amount: paid, description: `فاتورة مشتريات #${finalInvoiceNo}`, referenceType: 'purchase', referenceId: createdInvoice.id }, userId, branchId);
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
                        tenantId,
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
                        tenantId,
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

            const { postPurchaseInvoice, postGRN } = await import('@/lib/auto-journal');
            const journalResult = await postPurchaseInvoice({
                invoiceNo: finalInvoiceNo,
                subtotal,
                taxValue,
                total,
                paymentType,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
                ppvAmount: calculatedPpv,
                hasGRN: receiptStatus === 'received', // [EG-02] GRN already posted → clear GRNI
                txClient: tx,
                overrideContext
            });

            if (journalResult && (journalResult as any).success === false) {
                 throw new Error('فشل إنشاء القيد المحاسبي لفاتورة المشتريات');
            }

            // [Phase 1.5.2D] If immediate receipt, post GRN to clear GRNI
            if (receiptStatus === 'received') {
                const totalCost = Number(subtotal) - Number(calculatedPpv || 0);
                if (totalCost > 0.01) {
                    await postGRN({
                        grnNo: finalInvoiceNo,
                        totalCost,
                        supplierName: `مورد ${body.supplierId || 'غير محدد'}`,
                        userId: userId || undefined,
                        branchId: branchId || undefined,
                        date: new Date().toISOString().split('T')[0],
                        txClient: tx,
                        overrideContext
                    });
                }
            }

            const { logAuditEvent } = await import('@/lib/audit-trail');
            await logAuditEvent(tx as any, {
                tenantId: request.headers.get('x-tenant') || 'default',
                userId: userId || null,
                action: 'CREATE',
                entityType: 'PurchaseInvoice',
                entityId: createdInvoice.id,
                route: '/api/purchases',
                newData: {
                    invoiceNo: createdInvoice.invoiceNo,
                    total: createdInvoice.total,
                    paymentType: createdInvoice.paymentType,
                },
                ipAddress: request.headers.get('x-forwarded-for') || null,
            });

            return createdInvoice;
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error: any) {
 log.error('src/app/api/purchases/route.ts', { error: error instanceof Error ? error.message : error });
 return handleApiError(error); }
}

async function _PUT(request: Request) {

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        const { invoiceId, amount, paymentType, userId } = purchasePaymentSchema.parse(rawBody);

        const tenantId = requireTenantId(request as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const auth = getUserFromRequest(request as any);
        const overrideContext = buildOverrideContextFromRequest(request as any, {
            tenantId,
            actorId: String(auth?.userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        const invoice = await prisma.purchaseInvoice.findFirst({ where: { id: Number(invoiceId), tenantId } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        if (invoice.status === 'cancelled' || invoice.status === 'reversed') {
            return NextResponse.json({ error: 'لا يمكن تسديد دفعة لفاتورة مشتريات ملغاة أو معكوسة' }, { status: 400 });
        }

        if (invoice.status === 'completed') {
            return NextResponse.json({ error: 'الفاتورة مدفوعة بالكامل' }, { status: 400 });
        }

        const payAmount = Number(amount);
        if (payAmount > n(invoice.remaining)) {
            return NextResponse.json({ error: 'المبلغ المدفوع يتجاوز الرصيد المتبقي للفاتورة' }, { status: 400 });
        }
        if (payAmount <= 0) return NextResponse.json({ error: 'لا يوجد رصيد مستحق' }, { status: 400 });

        const newPaid = n(invoice.paid) + payAmount;
        const newRemaining = n(invoice.total) - newPaid;

        const updated = await runFinancialTx(prisma, async (tx: any) => {
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

            const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
            const treasuryRec = await TreasuryPostingService.createTreasuryEntry(tx, {
                type: 'out',
                amount: payAmount,
                description: `تسديد دفعة - فاتورة مشتريات #${invoice.invoiceNo}`,
                referenceType: 'purchase_payment',
                referenceId: invoice.id,
            }, parsedUserId, branchId);

            const { postPurchasePayment } = await import('@/lib/auto-journal');
            await postPurchasePayment({
                invoiceNo: invoice.invoiceNo,
                amount: payAmount,
                paymentType: paymentType as 'cash' | 'bank',
                treasuryId: treasuryRec.id,
                userId: parsedUserId,
                branchId: branchId,
                date: new Date().toISOString().split('T')[0],
                txClient: tx,
                overrideContext
            });

            const { logAuditEvent } = await import('@/lib/audit-trail');
            await logAuditEvent(tx as any, {
                tenantId: request.headers.get('x-tenant') || 'default',
                userId: parsedUserId,
                action: 'UPDATE',
                entityType: 'PurchaseInvoicePayment',
                entityId: invoice.id,
                route: '/api/purchases',
                oldData: { paid: invoice.paid, remaining: invoice.remaining },
                newData: { paid: newPaid, remaining: newRemaining, amountPaid: payAmount },
                ipAddress: request.headers.get('x-forwarded-for') || null,
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
        const tenantId = requireTenantId(request as any);
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'delete_invoices', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف الفواتير' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));
        if (!id) return NextResponse.json({ error: 'معرف الفاتورة مطلوب' }, { status: 400 });

        const invoice = await prisma.purchaseInvoice.findFirst({ where: { id, tenantId }, include: { details: true } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        try {
            assertEditable(invoice.status, 'PurchaseInvoice');
        } catch (stateErr: any) {
            return NextResponse.json({ error: stateErr.message }, { status: 422 });
        }

        await runFinancialTx(prisma, async (tx: any) => {
            // 1. Reverse Original Purchase Journal
            await reverseJournalByReference({
                originalReference: `PUR-${invoice.invoiceNo}`,
                userId: auth.userId,
                txClient: tx
            });

            // 2. Reverse Purchase Payment Journals
            const paymentJournals = await tx.journalEntry.findMany({
                where: { reference: { startsWith: `PUR-PAY-${invoice.invoiceNo}-` } },
                select: { reference: true }
            });
            const distinctPayRefs = Array.from(new Set(paymentJournals.map((j: any) => j.reference)));
            for (const ref of distinctPayRefs) {
                await reverseJournalByReference({
                    originalReference: ref as string,
                    userId: auth.userId,
                    txClient: tx
                });
            }

            // 3. Reverse stock (decrement what was added from purchase) ONLY IF it was actually received
            if (invoice.receiptStatus === 'received') {
                for (const detail of invoice.details) {
                    await tx.product.updateMany({
                        where: { id: detail.productId, tenantId },
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

            // 4. Remove related treasury entries
            await tx.treasury.deleteMany({ where: { referenceType: { in: ['purchase', 'purchase_payment'] }, referenceId: id, tenantId } });

            // Delete invoice (cascade deletes details)
            await tx.purchaseInvoice.deleteMany({ where: { id, tenantId } });

            const { logAuditEvent } = await import('@/lib/audit-trail');
            await logAuditEvent(tx as any, {
                tenantId: request.headers.get('x-tenant') || 'default',
                userId: auth.userId,
                action: 'DELETE',
                entityType: 'PurchaseInvoice',
                entityId: invoice.id,
                route: '/api/purchases',
                oldData: { invoiceNo: invoice.invoiceNo, total: invoice.total },
                ipAddress: request.headers.get('x-forwarded-for') || null,
            });
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

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header. Required for Purchases operations." }, { status: 400 });
    
    const isUnique = await lockIdempotencyKey(tenantString, 'purchases_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    
    try {
        const response = await _POST(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'purchases_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'purchases_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'purchases_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL' });

export const PUT = withRoute(async ({ req }) => {
    const { withIdempotency } = await import('@/lib/idempotency');
    return withIdempotency(req as NextRequest, 'PUT /api/purchases', async () => _PUT(req as any));
}, { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'FINANCIAL' });
