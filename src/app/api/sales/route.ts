import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2, validateMoney } from '@/lib/money';
import { postSalesInvoice, reverseJournalByReference } from '@/lib/auto-journal';
import { initializeZatca, generateZatcaQR, getQrCodeContent, generateZATCAXml, generateZatcaQRContent, InvoiceData, InvoiceLine } from '@/lib/zatca';
import { ZatcaJavaAdapter } from '@/lib/zatca-java';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';
import { resolveStockAndBranch } from '@/lib/getDefaults';
import { z } from 'zod';
import { checkQuota, quotaErrorResponse } from '@/lib/quotaGuard';
import { logDelete, auditContextFromRequest } from '@/lib/field-audit';
import { logger } from '@/lib/logger';
import { requireTenantId } from '@/lib/governance/tenant-guard';
const log = logger.child({ route: 'sales' });
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';
import { assertEditable, isTerminal } from '@/lib/document-state-machine';
import { getNextNumber } from '@/lib/numbering';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';

const SalesItemSchema = z.object({
    productId: z.union([z.string(), z.number()]),
    productName: z.string().optional(),
    quantity: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().positive('الكمية يجب أن تكون أكبر من صفر')),
    price: z.union([z.string(), z.number()]),
    discountRate: z.union([z.string(), z.number()]).optional().default(0),
    unitFactor: z.union([z.string(), z.number()]).optional().default(1),
});

const SalesInvoiceSchema = z.object({
    manualDate: z.string().optional().nullable(),
    manualInvoiceNo: z.union([z.string(), z.number()]).optional().nullable(),
    customerId: z.union([z.string(), z.number()]).optional().nullable(),
    stockId: z.union([z.string(), z.number()]).optional().nullable(),
    taxRate: z.union([z.string(), z.number()]).optional().default(15),
    isTaxInclusive: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').optional().default(false),
    discountRate: z.union([z.string(), z.number()]).optional().default(0),
    paid: z.union([z.string(), z.number()]).optional(),
    paymentType: z.string().optional().default('cash'),
    splitCash: z.union([z.string(), z.number()]).optional().default(0),
    splitCard: z.union([z.string(), z.number()]).optional().default(0),
    userId: z.union([z.string(), z.number()]).optional().nullable(),
    branchId: z.union([z.string(), z.number()]).optional().nullable(),
    notes: z.string().optional().nullable(),
    currencyId: z.union([z.string(), z.number()]).optional().nullable(),
    exchangeRate: z.union([z.string(), z.number()]).optional().default(1.0),
    items: z.array(SalesItemSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
    docType: z.string().optional().default('invoice'),
    originalInvoiceId: z.union([z.string(), z.number()]).optional().nullable(),
    idempotencyKey: z.string().optional().nullable(),
});

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');
        const invoiceNoQuery = searchParams.get('invoiceNo');

        const auth = getUserFromRequest(request as any);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;
        const tenantId = requireTenantId(request as any);

        const where: Record<string, unknown> = { tenantId };
        if (from || to) {
            where.date = {};
            if (from) (where.date as Record<string, unknown>).gte = new Date(from);
            if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59');
        }

        if (invoiceNoQuery) {
            where.invoiceNo = parseInt(invoiceNoQuery);
        }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const invoices = await prisma.salesInvoice.findMany({ take: 100,
            where,
            include: { customer: true, details: true, user: { select: { id: true, username: true, fullName: true, role: true, phone: true } } },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(invoices);
    } catch (error: any) {
        log.error('Sales GET error', { err: error?.message });
        return NextResponse.json([], { status: 500 });
    }
}

export async function _POST(request: Request) {

    const prisma = getPrisma(request);
    try {
        const tenantId = requireTenantId(request as any);
        const rawBody = await request.json();
        
        const parsed = SalesInvoiceSchema.safeParse(rawBody);
        if (!parsed.success) {
            return apiError({ message: 'بيانات غير صالحة', errors: parsed.error.format() }, 'تأكد من إدخال جميع الحقول بشكل صحيح', { status: 400 });
        }
        const body = parsed.data;

        log.debug('Received sales payload', { manualDate: body.manualDate, manualInvoiceNo: body.manualInvoiceNo });

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const auth = getUserFromRequest(request as any);
        const overrideContext = buildOverrideContextFromRequest(request as any, {
            tenantId,
            actorId: String(auth?.userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        // --- Quota Guard (Trial + Invoice Limit) ---
        const tenant = (request as any).headers?.get?.('x-tenant') ||
            (request instanceof Request ? request.headers.get('x-tenant') : null);
        if (tenant) {
            const quotaCheck = await checkQuota(tenant, 'invoice');
            if (!quotaCheck.allowed) return quotaErrorResponse(quotaCheck);
        }
        // ------------------------------------------

        // invoiceNo is generated inside the financial transaction to prevent concurrency conflicts
        const invoiceDate = body.manualDate ? new Date(body.manualDate) : new Date();

        // ── Period Lock Enforcement ────────────────────────────────────────
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate: invoiceDate,
                operationType: 'CREATE_SALES_INVOICE',
                module: 'sales',
                actor: String(auth?.userId || 'SYSTEM'),
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

        // ── Credit Limit Enforcement ────────────────────────────────────────
        if (body.customerId) {
            const customer = await prisma.customer.findFirst({
                where: { id: Number(body.customerId), tenantId },
                select: { creditLimit: true, balance: true, name: true, creditHold: true, creditHoldReason: true, active: true },
            });
            if (customer) {
                if (!customer.active) {
                    return NextResponse.json({
                        error: `العميل "${customer.name}" غير نشط. لا يمكن إتمام المعاملة.`,
                        code: 'CUSTOMER_INACTIVE'
                    }, { status: 422 });
                }

                // Calculate invoice total estimate for check
                let estTotal = 0;
                for (const item of body.items) {
                    const p = Number(item.price) || 0;
                    const q = Number(item.quantity) || 1;
                    estTotal += p * q;
                }
                const paid = body.paid !== undefined ? Number(body.paid) : estTotal;
                const willBeOwed = estTotal - paid; // ما سيبقى ديناً على العميل

                const paymentTypeLower = String(body.paymentType || 'cash').toLowerCase();
                const isCredit = paymentTypeLower === 'credit' || paymentTypeLower === 'bnpl' || paymentTypeLower === 'on_account' || willBeOwed > 0;

                if (isCredit && customer.creditHold) {
                    return NextResponse.json({
                        error: `العميل "${customer.name}" موقوف ائتمانياً. السبب: ${customer.creditHoldReason || 'غير محدد'}`,
                        code: 'CREDIT_HOLD_ACTIVE'
                    }, { status: 422 });
                }

                if (n(customer.creditLimit) > 0) {
                    const currentBalance = n(customer.balance); // رصيد حالي (ديون قائمة)
                    if (isCredit && (currentBalance + willBeOwed) > n(customer.creditLimit)) {
                        return NextResponse.json({
                            error: `تجاوز حد الائتمان — العميل "${customer.name}" لديه رصيد مديون ${currentBalance.toFixed(2)} ر.س والحد المسموح ${n(customer.creditLimit).toFixed(2)} ر.س. المبلغ الإضافي المطلوب: ${willBeOwed.toFixed(2)} ر.س`,
                            code: 'CREDIT_LIMIT_EXCEEDED',
                            currentBalance,
                            creditLimit: customer.creditLimit,
                            required: willBeOwed,
                        }, { status: 422 });
                    }
                }
            }
        }
        // ────────────────────────────────────────────────────────────────────

        // Calculate totals — support dynamic tax rate and inclusive/exclusive VAT mode
        const bodyTaxRate = body.taxRate !== undefined ? Number(body.taxRate) : 15; // rate sent from frontend settings

        // ── Tax Group Validation ────────────────────────────────────────────
        const { validateTaxRate } = await import('@/lib/tax-validation');
        const taxValidation = await validateTaxRate(bodyTaxRate, tenantId, prisma);
        if (!taxValidation.valid) {
            return NextResponse.json({
                error: taxValidation.error,
                code: 'INVALID_TAX_RATE',
                allowedRates: taxValidation.allowedRates
            }, { status: 422 });
        }
        // ────────────────────────────────────────────────────────────────────

        const bodyTaxInclusive = body.isTaxInclusive === true || String(body.isTaxInclusive) === 'true';
        let subtotal = 0;
        const items = body.items || [];
        for (const item of items) {
            let price = validateMoney(item.price);
            if (bodyTaxInclusive) {
                // Extract VAT from the price: priceExclVat = price * 100 / (100 + rate)
                price = price * 100 / (100 + bodyTaxRate);
                item.price = price; // update in place for details creation
            }
            const itemTotal = (item.quantity ? validateMoney(item.quantity, 'الكمية') : 1) * price;
            const itemDiscount = itemTotal * ((Number(item.discountRate) || 0) / 100);
            subtotal += itemTotal - itemDiscount;
        }

        const discountRate = Number(body.discountRate) || 0;
        const discountValue = round2(subtotal * (discountRate / 100));
        const afterDiscount = round2(subtotal - discountValue);
        const taxValue = round2(afterDiscount * (bodyTaxRate / 100));
        const total = round2(afterDiscount + taxValue);
        const paid = body.paid !== undefined ? round2(Number(body.paid)) : total;
        const remaining = round2(total - paid);

        const userId = body.userId ? Number(body.userId) : null;

        // ── Auto-resolve stockId + branchId from warehouse ─────────────────
        // branchId is always derived from Stock.branchId to prevent accounting mix-ups
        const userBranchFallback = body.branchId ? Number(body.branchId) : (
            userId ? (await prisma.user.findFirst({ where: { id: userId }, select: { branchId: true } }))?.branchId ?? null : null
        );
        const { stockId: resolvedStockId, branchId } = await resolveStockAndBranch(
            body.stockId,
            userBranchFallback
        );

        
        const invoice = await runFinancialTx(prisma, async (tx: any) => {
            // [ZATCA ICV RACE CONDITION FIX] Lock the zatca counter rows exclusively in this transaction
            await tx.$executeRaw`SELECT id FROM "settings" WHERE "key" IN ('zatca_invoice_counter', 'zatca_last_pih') FOR UPDATE`;

            let finalInvoiceNo: number;
            let formattedNo = '';
            if (body.manualInvoiceNo) {
                finalInvoiceNo = Number(body.manualInvoiceNo);
                formattedNo = String(body.manualInvoiceNo);
            } else {
                const seqResult = await getNextNumber(tx, 'INV', branchId);
                finalInvoiceNo = seqResult.current;
                formattedNo = seqResult.formatted;
            }

            const createdInvoice = await tx.salesInvoice.create({
                data: {
                    tenantId,
                    date: invoiceDate,
                    branchId,
                    invoiceNo: finalInvoiceNo,
                    customerId: body.customerId ? Number(body.customerId) : null,
                    stockId: resolvedStockId,
                    subtotal,
                    discountRate,
                    discountValue,
                    taxValue,
                    total,
                    paid,
                    remaining,
                    paymentType: body.paymentType || 'cash',
                    splitCash: body.splitCash ? Number(body.splitCash) : 0,
                    splitCard: body.splitCard ? Number(body.splitCard) : 0,
                    status: remaining > 0 ? 'pending' : 'completed',
                    userId: userId,
                    notes: body.notes || null,
                    docType: body.docType || 'invoice',
                    originalInvoiceId: body.originalInvoiceId ? Number(body.originalInvoiceId) : null,
                    currencyId: body.currencyId ? Number(body.currencyId) : null,
                    exchangeRate: body.exchangeRate ? Number(body.exchangeRate) : 1.0,
                    details: {
                        create: items.map((item: Record<string, unknown>) => {
                            const qty = item.quantity ? validateMoney(item.quantity, 'الكمية') : 1;
                            const price = validateMoney(item.price, 'السعر');
                            const dRate = item.discountRate ? validateMoney(item.discountRate, 'نسبة الخصم') : 0;
                            const itemSubtotal = qty * price;
                            const dValue = round2(itemSubtotal * (dRate / 100));
                            const afterD = round2(itemSubtotal - dValue);
                            const tax = round2(afterD * (bodyTaxRate / 100));
                            return {
                                productId: parseInt(item.productId as string),
                                productName: item.productName as string || '',
                                quantity: qty,
                                price,
                                discountRate: dRate,
                                discountValue: dValue,
                                taxRate: bodyTaxRate,
                                taxValue: tax,
                                total: round2(afterD + tax),
                            };
                        }),
                    },
                } as any,
                include: { details: true, customer: true },
            });

            // Update stock with smart auto-decompose
            const allowNegativeStock = await tx.setting.findFirst({ where: { key: 'POS_ALLOW_NEGATIVE_STOCK', tenantId } });
            const canGoNegative = allowNegativeStock?.value === 'true';

            let totalCost = 0;
            for (const item of items) {
                const qty = Number(item.quantity) || 1;
                const productId = Number(item.productId);
                const unitFactor = Number(item.unitFactor) || 1;
                const qtyInBase = qty * unitFactor;

                const pUnits = await tx.productUnit.findMany({ take: 100,
                    where: { productId },
                    include: { unit: true },
                    orderBy: { factor: 'asc' },
                });

                const prod = await tx.product.findFirst({ where: { id: productId, tenantId }, select: { currentStock: true, buyPrice: true } });
                const baseStock = n(prod?.currentStock);
                const unitsStock = pUnits.reduce((s: any, u: any) => s + Number((u as any).unitStock || 0) * u.factor, 0);
                const totalBase = baseStock + unitsStock;
                
                totalCost += (n(prod?.buyPrice) || 0) * qtyInBase;

                if (!canGoNegative && qtyInBase > totalBase) {
                    throw new Error(`نفد مخزون الصنف ${item.productName}`);
                }

                await tx.product.updateMany({
                    where: { id: productId, tenantId },
                    data: { currentStock: { decrement: qtyInBase } },
                });

                const refreshed = await tx.product.findFirst({ where: { id: productId, tenantId }, select: { currentStock: true } });
                let deficit = Math.abs(Math.min(0, n(refreshed?.currentStock || 0)));

                for (const pu of pUnits) {
                    if (deficit <= 0) break;
                    if ((pu as any).unitStock <= 0) continue;
                    const toBreak = Math.min(Math.ceil(deficit / n(pu.factor)), Number((pu as any).unitStock || 0));
                    await tx.productUnit.update({
                        where: { id: pu.id },
                        data: { unitStock: { decrement: toBreak } } as any,
                    });
                    await tx.product.updateMany({
                        where: { id: productId, tenantId },
                        data: { currentStock: { increment: toBreak * n(pu.factor) } },
                    });
                    deficit = Math.max(0, deficit - toBreak * n(pu.factor));
                }

                await tx.productStock.upsert({
                    where: { productId_stockId: { productId, stockId: createdInvoice.stockId } },
                    update: { quantity: { decrement: qtyInBase } },
                    create: { productId, stockId: createdInvoice.stockId, quantity: -qtyInBase },
                });
                
                await tx.stockMovement.create({
                    data: {
                        tenantId,
                        productId: productId,
                        stockId: createdInvoice.stockId,
                        type: 'out',
                        quantity: qtyInBase,
                        referenceType: 'sales_invoice',
                        referenceId: createdInvoice.id,
                        userId: userId,
                        notes: `فاتورة مبيعات #${finalInvoiceNo}`
                    }
                });

                const activeRecipe = await tx.recipe.findFirst({
                    where: { finishedProductId: Number(item.productId), isActive: true, tenantId },
                    include: { ingredients: true }
                });

                if (activeRecipe && activeRecipe.ingredients.length > 0) {
                    for (const ing of activeRecipe.ingredients) {
                        const requiredQty = ing.quantity * qty;
                        
                        await tx.product.updateMany({
                            where: { id: ing.rawProductId, tenantId },
                            data: { currentStock: { decrement: requiredQty } }
                        });

                        await tx.productStock.upsert({
                            where: { productId_stockId: { productId: ing.rawProductId, stockId: createdInvoice.stockId } },
                            update: { quantity: { decrement: requiredQty } },
                            create: { productId: ing.rawProductId, stockId: createdInvoice.stockId, quantity: -requiredQty }
                        });
                    }
                }
            }

            // [STATE MACHINE AUDIT FIX] Ensure POS creations are properly logged in the audit trail
            try {
                await tx.auditLog.create({
                    data: {
                        tenantId,
                        userId: userId ?? 0,
                        action: `transition:draft→${createdInvoice.status}`,
                        tableName: 'salesinvoices',
                        recordId: String(createdInvoice.id),
                        details: `Direct POS API Creation (State-Machine Bypass Handled)`,
                    },
                });
            } catch (e: any) {
                log.error('[document-state-machine] POS audit log failed', { err: e?.message });
            }

            if (paid > 0) {
                if (body.paymentType === 'split') {
                    const sCash = Number(body.splitCash) || 0;
                    const sCard = Number(body.splitCard) || 0;
                    if (sCash > 0) {
                        const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                        await TreasuryPostingService.createTreasuryEntry(tx, { type: 'in', amount: sCash, description: `تحصيل نقدي - فاتورة مبيعات #${finalInvoiceNo}`, referenceType: 'sale', referenceId: createdInvoice.id }, userId, branchId);
                    }
                    if (sCard > 0) {
                        const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                        await TreasuryPostingService.createTreasuryEntry(tx, { type: 'in', amount: sCard, description: `مسدد بالشبكة - فاتورة مبيعات #${finalInvoiceNo}`, referenceType: 'sale', referenceId: createdInvoice.id }, userId, branchId);
                    }
                } else {
                    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                    await TreasuryPostingService.createTreasuryEntry(tx, {
                            type: 'in',
                            amount: paid,
                            description: `فاتورة مبيعات #${finalInvoiceNo}`,
                            referenceType: 'sale',
                            referenceId: createdInvoice.id,
                        }, userId, branchId);
                }
            }

            // [EG-03 FIX] Outbox Pattern for ZATCA & Financial Atomicity
            const idempotencyKey = body.idempotencyKey || null;

            const finalSettings: Record<string, string> = {};
            const zatcaSettings = await tx.setting.findMany({ 
                take: 100,
                where: { key: { in: ['company_name', 'tax_number', 'zatca_enabled'] }, tenantId }
            });
            zatcaSettings.forEach((st: any) => { finalSettings[st.key] = st.value ?? ''; });

            let zatcaQRStr = '';
            // Generate basic Phase 1 QR for immediate receipt printing
            if (finalSettings['company_name'] && finalSettings['tax_number']) {
                zatcaQRStr = generateZatcaQRContent({
                    sellerName: finalSettings['company_name'],
                    vatNumber: finalSettings['tax_number'],
                    timestamp: createdInvoice.date.toISOString(),
                    totalWithVat: total,
                    vatAmount: taxValue,
                });
            }

            if (finalSettings['zatca_enabled'] === '1') {
                // Defer ZATCA Phase 2 (Generation, Signing, Reporting) to Background Queue
                await tx.outboxEvent.create({
                    data: {
                        tenantId,
                        aggregateId: String(createdInvoice.id),
                        aggregateType: 'sales_invoice',
                        eventType: 'ZATCA_REPORT_JOB',
                        payload: { invoiceId: createdInvoice.id, idempotencyKey },
                        status: 'PENDING'
                    }
                });
                
                await tx.salesInvoice.update({
                    where: { id: createdInvoice.id, tenantId },
                    data: { zatcaStatus: 'ZATCA_PENDING', status: 'POSTED', zatcaQr: zatcaQRStr }
                });
            } else {
                await tx.salesInvoice.update({ 
                    where: { id: createdInvoice.id, tenantId }, 
                    data: { zatcaQr: zatcaQRStr, status: 'POSTED' } 
                });
            }

            // Auto-journal entry INSIDE the transaction
            const { postSalesInvoice } = await import('@/lib/auto-journal');
            const journalResult = await postSalesInvoice({
                invoiceNo: finalInvoiceNo,
                subtotal: afterDiscount,
                taxValue,
                total,
                paymentType: body.paymentType || 'cash',
                splitCash: body.splitCash ? Number(body.splitCash) : 0,
                splitCard: body.splitCard ? Number(body.splitCard) : 0,
                userId: userId || undefined,
                branchId: branchId || undefined,
                discountValue,
                totalCost: totalCost,
                date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0],
                txClient: tx,
                overrideContext
            });

            if (!journalResult.success) {
                throw new Error(`Failed to create Journal Entry: ${journalResult.error}`);
            }

            return { createdInvoice, zatcaQRStr };
        }, 'sales-create');

        return NextResponse.json({ success: true, ...invoice.createdInvoice, zatcaQR: invoice.zatcaQRStr }, { status: 201 });

    } catch (error: any) {
        log.error('Sales create error', { err: error?.message });
        return NextResponse.json({ error: 'فشل في إنشاء الفاتورة' }, { status: 500 });
    }
}

async function _PUT(request: Request) {

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        const { invoiceId, amount, paymentType, userId } = z.object({
            invoiceId: z.union([z.string(), z.number()]),
            amount: z.union([z.string(), z.number()]),
            paymentType: z.string().default('cash'),
            userId: z.union([z.string(), z.number()]).optional().nullable(),
        }).parse(rawBody);

        const tenantId = requireTenantId(request as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const auth = getUserFromRequest(request as any);
        const overrideContext = buildOverrideContextFromRequest(request as any, {
            tenantId,
            actorId: String(auth?.userId || '0'),
            actorRole: auth?.role || 'USER'
        });
        const invoice = await prisma.salesInvoice.findUnique({ where: { id: Number(invoiceId), tenantId } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        if (invoice.status === 'cancelled' || invoice.status === 'reversed') {
            return NextResponse.json({ error: 'لا يمكن تحصيل دفعة لفاتورة ملغاة أو معكوسة' }, { status: 400 });
        }

        if (invoice.status === 'completed') {
            return NextResponse.json({ error: 'الفاتورة محصلة بالكامل' }, { status: 400 });
        }

        const payAmount = Number(amount);
        if (payAmount > n(invoice.remaining)) {
            return NextResponse.json({ error: 'المبلغ المدفوع يتجاوز الرصيد المتبقي للفاتورة' }, { status: 400 });
        }
        if (payAmount <= 0) return NextResponse.json({ error: 'لا يوجد رصيد مستحق أو المبلغ صفر' }, { status: 400 });

        const newPaid = n(invoice.paid) + payAmount;
        const newRemaining = n(invoice.total) - newPaid;

        const updated = await runFinancialTx(prisma, async (tx: any) => {
            const updatedInvoice = await tx.salesInvoice.update({
                where: { id: Number(invoiceId), tenantId },
                data: {
                    paid: newPaid,
                    remaining: newRemaining,
                    status: newRemaining <= 0 ? 'completed' : 'pending',
                },
            });

            const parsedUserId = userId ? Number(userId) : null;
            const branchId = invoice.branchId;

            const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
            const treasuryRec = await TreasuryPostingService.createTreasuryEntry(tx, {
                    type: 'in',
                    amount: payAmount,
                    description: `تحصيل دفعة - فاتورة مبيعات #${invoice.invoiceNo}`,
                    referenceType: 'sale_payment',
                    referenceId: invoice.id,
                }, parsedUserId, branchId);

            const { postSalesPayment } = await import('@/lib/auto-journal');
            await postSalesPayment({
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

            return updatedInvoice;
        });

        try {
            const { logFieldChanges } = await import('@/lib/field-audit');
            await logFieldChanges(prisma, 'SalesInvoice', Number(invoiceId), invoice, updated, auditContextFromRequest(request as any, { userId: userId ? Number(userId) : undefined }));
        } catch (e: any) { log.error('[audit] Sales payment audit failed:', { err: e?.message }); }

        return NextResponse.json(updated);
    } catch (error: any) {
        log.error('Sales PUT error', { err: error?.message });
        return NextResponse.json({ error: 'فشل في تحصيل الدفعة' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const id = Number(searchParams.get('id'));

        // Bulk delete all sales invoices
        if (action === 'delete_all') {
            const allowed = await hasPermission(auth.userId, 'delete_all_sales', prisma);
            if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف كل الفواتير' }, { status: 403 });

            // Reverse stock for ALL items before deleting
            const allSales = await prisma.salesInvoice.findMany({ take: 100, include: { details: true } });
            
            const hasTerminal = allSales.some(inv => isTerminal(inv.status));
            if (hasTerminal) {
                return NextResponse.json({ error: 'لا يمكن حذف الفواتير المحددة لوجود فواتير مرحّلة أو ملغاة أو معكوسة بينها. يرجى تصفية الفواتير أولاً.' }, { status: 400 });
            }
            
            const result = await runFinancialTx(prisma, async (tx: any) => {
                // Reverse stock
                for (const inv of allSales) {
                    for (const detail of inv.details) {
                        try {
                            await tx.product.updateMany({
                                where: { id: detail.productId, tenantId },
                                data: { currentStock: { increment: detail.quantity } }
                            });
                            await tx.productStock.upsert({
                                where: { productId_stockId: { productId: detail.productId, stockId: inv.stockId } },
                                update: { quantity: { increment: detail.quantity } },
                                create: { productId: detail.productId, stockId: inv.stockId, quantity: detail.quantity },
                            });
                        } catch (e: any) {
                            log.error('src/app/api/sales/route.ts', { error: e instanceof Error ? e.message : e });

                            // Ignored (Product might have been deleted)
                        }
                    }
                }
                
                // Reverse all Sales and Sales Payment Journals
                const allJournals = await tx.journalEntry.findMany({
                    where: { 
                        OR: [
                            { reference: { startsWith: 'SALE-' } },
                            { reference: { startsWith: 'SAL-PAY-' } }
                        ]
                    },
                    select: { reference: true }
                });
                
                const distinctRefs = Array.from(new Set(allJournals.map((j: any) => j.reference)));
                for (const ref of distinctRefs) {
                    await reverseJournalByReference({
                        originalReference: ref as string,
                        userId: auth.userId,
                        txClient: tx
                    });
                }

                await tx.salesInvoiceDetail.deleteMany({});
                await tx.treasury.deleteMany({ where: { referenceType: 'sale', tenantId } });
                return await tx.salesInvoice.deleteMany({ where: { tenantId } });
            });
            return NextResponse.json({ success: true, message: `تم حذف ${result.count} فاتورة مبيعات مع عكس المخزون والقيود المحاسبية` });
        }

        // Single invoice delete
        const allowed = await hasPermission(auth.userId, 'delete_invoices', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف الفواتير' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'معرف الفاتورة مطلوب' }, { status: 400 });

        const tenantId = requireTenantId(request as any);
        const invoice = await prisma.salesInvoice.findUnique({ where: { id, tenantId }, include: { details: true } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        try {
            assertEditable(invoice.status, 'SalesInvoice');
        } catch (stateErr: any) {
            return NextResponse.json({ error: stateErr.message }, { status: 422 });
        }

        await runFinancialTx(prisma, async (tx: any) => {
            // Reverse stock (re-increment what was sold) safely for both global and warehouse stock
            for (const detail of invoice.details) {
                await tx.product.updateMany({
                    where: { id: detail.productId, tenantId },
                    data: { currentStock: { increment: detail.quantity } },
                });
                
                await tx.productStock.upsert({
                    where: { productId_stockId: { productId: detail.productId, stockId: invoice.stockId } },
                    update: { quantity: { increment: detail.quantity } },
                    create: { productId: detail.productId, stockId: invoice.stockId, quantity: detail.quantity },
                });
            }

            // Reverse Original Sale Journal
            await reverseJournalByReference({
                originalReference: `SALE-${invoice.invoiceNo}`,
                userId: auth.userId,
                txClient: tx
            });

            // Reverse Sales Payment Journals
            const paymentJournals = await tx.journalEntry.findMany({
                where: { reference: { startsWith: `SAL-PAY-${invoice.invoiceNo}-` } },
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

            // Remove related treasury entries
            await tx.treasury.deleteMany({ where: { referenceType: 'sale', referenceId: id, tenantId } });

            // Write to AuditLog for AI Fraud Engine
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId: auth.userId,
                    action: 'DELETE_SALES_INVOICE',
                    tableName: 'SalesInvoice',
                    recordId: String(id),
                    details: JSON.stringify({ invoiceNo: invoice.invoiceNo, total: invoice.total, subtotal: invoice.subtotal, items: invoice.details.length })
                }
            });

            // Delete invoice (cascade deletes details)
            await tx.salesInvoice.delete({ where: { id, tenantId } });
        });

        // Field-level audit trail (post-transaction)
        try {
            await logDelete(prisma, 'SalesInvoice', id, invoice as any, auditContextFromRequest(request, auth));
        } catch (e: any) { log.error('[audit] Sales delete field-audit failed', { err: e?.message }); }

        return NextResponse.json({ success: true, message: 'تم حذف الفاتورة بنجاح' });
    } catch (error: any) {
        log.error('Sales DELETE error', { err: error?.message });
        return NextResponse.json({ error: 'فشل في حذف الفاتورة' }, { status: 500 });
    }
}

// ── Route Security ────────────────────────────────────────────────────────
export const GET    = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', module: 'sales', permission: 'view' });

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'sales_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _POST(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'sales_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'sales_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'sales_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL', module: 'sales', permission: 'add' });

export const PUT = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'sales_put', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _PUT(req as any);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'sales_put', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'sales_put', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'sales_put', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL', module: 'sales', permission: 'edit' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT', module: 'sales', permission: 'delete' });
