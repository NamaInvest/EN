import { NextRequest, NextResponse } from 'next/server';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';
import { generateZatcaQRContent } from '@/lib/zatca';
import { round2, validateMoney } from '@/lib/money';
import { getNextNumber } from '@/lib/numbering';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';

const log = logger.child({ service: 'pos.checkout' });

const _POSTSchema = z.object({
  cart: z.any().optional(),
  total: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  paymentMethod: z.any().optional(),
  couponId: z.union([z.string(), z.number()]).optional(),
  splitCash: z.number().optional(),
  splitCard: z.number().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const tenantId = requireTenantId(req as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const overrideContext = buildOverrideContextFromRequest(req as any, {
            tenantId,
            actorId: String(auth?.userId || '0'),
            actorRole: auth?.role || 'USER'
        });

        // ── Period Lock Enforcement ────────────────────────────────────────
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate: new Date(),
                operationType: 'POS_CHECKOUT',
                module: 'pos',
                actor: String(auth?.userId || 'SYSTEM'),
                overrideContext
            });
        } catch (err) {
            if (err instanceof PeriodLockViolation) {
                return NextResponse.json({
                    success: false,
                    error: err.message,
                    code: err.code
                }, { status: err.code === 'LOCKED' ? 409 : 422 });
            }
            throw err;
        }
        // ────────────────────────────────────────────────────────────────────

        // ── Cashier POS Session Check ───────────────────────────────────────
        // يتحقق هذا الجزء من وجود وردية صندوق كاشير نشطة ومفتوحة للمستخدم الحالي تحت نفس المستأجر لمنع الفروقات المالية العالية بالصناديق.
        const activeSession = await prisma.posSession.findFirst({
            where: {
                userId: auth.userId,
                status: 'OPEN',
                tenantId
            }
        });
        if (!activeSession) {
            return NextResponse.json({
                success: false,
                error: 'لا يمكن إتمام عملية الدفع: لا توجد وردية صندوق كاشير نشطة ومفتوحة حالياً لهذا المستخدم. يرجى فتح وردية أولاً.',
                code: 'NO_ACTIVE_POS_SESSION'
            }, { status: 400 });
        }
        // ────────────────────────────────────────────────────────────────────

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { cart, total, tax, discount, customerId, paymentMethod, couponId, splitCash, splitCard } = body;

        if (!cart || !cart.length) {
            return NextResponse.json({ success: false, error: 'السلة فارغة' }, { status: 400 });
        }

        // ── Tax Group Validation ────────────────────────────────────────────
        const { validateTaxRate } = await import('@/lib/tax-validation');
        for (const item of cart) {
            const itemTaxRate = item.taxRate !== undefined ? Number(item.taxRate) : 15;
            const taxValidation = await validateTaxRate(itemTaxRate, tenantId, prisma);
            if (!taxValidation.valid) {
                return NextResponse.json({
                    success: false,
                    error: taxValidation.error,
                    code: 'INVALID_TAX_RATE',
                    allowedRates: taxValidation.allowedRates
                }, { status: 400 });
            }
        }
        // ────────────────────────────────────────────────────────────────────

        // Validate monetary amounts
        const vTotal = validateMoney(total, 'الإجمالي');
        const vTax = validateMoney(tax, 'الضريبة');
        const vDiscount = validateMoney(discount || 0, 'الخصم');

        const finalTotal = round2(vTotal + vTax - vDiscount);

        // Validate customer credit and active status if customerId is passed
        if (customerId) {
            const customer = await prisma.customer.findFirst({
                where: { id: parseInt(customerId), tenantId },
                select: { creditLimit: true, balance: true, name: true, creditHold: true, creditHoldReason: true, active: true },
            });
            if (customer) {
                if (!customer.active) {
                    return NextResponse.json({ success: false, error: `العميل "${customer.name}" غير نشط. لا يمكن إتمام المعاملة.` }, { status: 400 });
                }

                const paymentMethodLower = String(paymentMethod).toLowerCase();
                const isCreditPayment = paymentMethodLower === 'credit' || paymentMethodLower === 'bnpl' || paymentMethodLower === 'on_account';
                
                if (isCreditPayment) {
                    if (customer.creditHold) {
                        return NextResponse.json({
                            success: false,
                            error: `العميل "${customer.name}" موقوف ائتمانياً. السبب: ${customer.creditHoldReason || 'غير محدد'}`,
                            code: 'CREDIT_HOLD_ACTIVE'
                        }, { status: 400 });
                    }

                    if (n(customer.creditLimit) > 0) {
                        const currentBalance = n(customer.balance);
                        if ((currentBalance + finalTotal) > n(customer.creditLimit)) {
                            return NextResponse.json({
                                success: false,
                                error: `تجاوز حد الائتمان — العميل "${customer.name}" لديه رصيد مديون ${currentBalance.toFixed(2)} ر.س والحد المسموح ${n(customer.creditLimit).toFixed(2)} ر.س. المبلغ الإضافي المطلوب: ${finalTotal.toFixed(2)} ر.س`,
                                code: 'CREDIT_LIMIT_EXCEEDED'
                            }, { status: 400 });
                        }
                    }
                }
            }
        }

        // 2. Transaction to ensure atomicity: Create Invoice + Deduct Stock
        const invoice = await runFinancialTx(prisma, async (tx: any) => {
            
            // Generate Invoice Number inside transaction to prevent race conditions
            const seqResult = await getNextNumber(tx, 'INV');
            const invoiceNo = seqResult.current;
            const formattedInvoiceNo = seqResult.formatted;

            // Create Invoice Header
            const newInvoice = await tx.salesInvoice.create({
                data: {
                    tenantId,
                    invoiceNo,
                    date: new Date(),
                    customerId: customerId ? parseInt(customerId) : null,
                    subtotal: total,
                    taxValue: tax,
                    discountValue: discount || 0,
                    total: finalTotal,
                    paid: finalTotal, // POS is fully paid
                    remaining: 0,
                    paymentType: paymentMethod || 'cash',
                    splitCash: paymentMethod === 'split' ? (splitCash || 0) : 0,
                    splitCard: paymentMethod === 'split' ? (splitCard || 0) : 0,
                    status: 'completed',
                    userId: auth.userId,
                    notes: `فاتورة نقاط البيع السريعة (POS)${body.bnplOrderId ? ` - طريقة الدفع: ${paymentMethod} (${body.bnplOrderId})` : ''}`,
                }
            });

            // Create Invoice Details & Deduct Stock
            let totalCost = 0;
            for (const item of cart) {
                const safePrice = validateMoney(item.price, 'السعر');
                const safeQty = validateMoney(item.qty, 'الكمية');
                const itemTotal = round2(safePrice * safeQty);
                const itemTax = round2(itemTotal * ((item.taxRate || 15) / 100));

                await tx.salesInvoiceDetail.create({
                    data: {
                        tenantId,
                        invoiceId: newInvoice.id,
                        productId: parseInt(item.id),
                        productName: item.name,
                        quantity: safeQty,
                        price: safePrice,
                        taxRate: item.taxRate || 15,
                        taxValue: itemTax,
                        total: round2(itemTotal + itemTax)
                    }
                });

                // Deduct Inventory safely considering Factor (Multi-Units)
                const deductionQty = safeQty * validateMoney(item.factor || 1, 'المعامل');
                const product = await tx.product.findFirst({ where: { id: parseInt(item.id), tenantId } });
                await tx.product.updateMany({
                    where: { id: parseInt(item.id), tenantId },
                    data: { currentStock: { decrement: deductionQty } }
                });
                
                // Track cost of goods sold
                totalCost += n(product?.buyPrice || 0) * deductionQty;
            }

        // 3. Handle Coupon Usage if applicable
            if (couponId && discount > 0) {
                await tx.couponUsage.create({
                    data: {
                        tenantId,
                        couponId: parseInt(couponId),
                        invoiceId: newInvoice.id,
                        customerId: customerId ? parseInt(customerId) : null,
                        discountAmount: discount
                    }
                });
                await tx.coupon.updateMany({
                    where: { id: parseInt(couponId), tenantId },
                    data: { usedCount: { increment: 1 } }
                });
            }

            // 4. Handle Loyalty Points Earning
            if (customerId) {
                // Fetch the earn rate from global settings
                const earnRateSetting = await tx.setting.findFirst({ where: { key: 'loyalty_earn_rate', tenantId } });
                const earnRate = earnRateSetting?.value ? parseInt(earnRateSetting.value) : 10;
                
                const earnedPoints = Math.floor(finalTotal / earnRate);
                
                if (earnedPoints > 0) {
                    const existingLoyalty = await tx.loyaltyPoint.findFirst({
                        where: { customerId: parseInt(customerId), tenantId }
                    });

                    if (existingLoyalty) {
                        await tx.loyaltyPoint.updateMany({
                            where: { id: existingLoyalty.id, tenantId },
                            data: {
                                points: { increment: earnedPoints },
                                totalEarned: { increment: earnedPoints }
                            }
                        });
                    } else {
                        await tx.loyaltyPoint.create({
                            data: {
                                tenantId,
                                customerId: parseInt(customerId),
                                points: earnedPoints,
                                totalEarned: earnedPoints,
                                tier: 'bronze'
                            }
                        });
                    }

                    await tx.loyaltyTransaction.create({
                        data: {
                            tenantId,
                            customerId: parseInt(customerId),
                            invoiceId: newInvoice.id,
                            points: earnedPoints,
                            type: 'earned',
                            description: `نقاط مكتسبة من الفاتورة رقم ${newInvoice.invoiceNo}`
                        }
                    });
                }
            }

            // 5. Automated Global Dual-Entry Accounting (POS to Master Journal)
            try {
                await postSalesInvoice({
                    invoiceNo: newInvoice.invoiceNo,
                    subtotal: total,
                    taxValue: tax,
                    total: finalTotal,
                    paymentType: paymentMethod || 'cash',
                    splitCash: paymentMethod === 'split' ? (splitCash || 0) : 0,
                    splitCard: paymentMethod === 'split' ? (splitCard || 0) : 0,
                    userId: auth.userId,
                    branchId: undefined, 
                    discountValue: discount || 0,
                    totalCost: totalCost,
                    date: new Date().toISOString().split('T')[0],
                    txClient: tx
                });
            } catch (journalErr: unknown) {
                log.warn('Auto-journal for POS sale skipped/failed:', journalErr);
            }

            return { newInvoice, totalCost, formattedInvoiceNo };
        });

        // Generate ZATCA Barcode for Receipt
        let zatcaQr = '';
        try {
            const zatcaSettings = await prisma.setting.findMany({ take: 100,
                where: { key: { in: ['company_name', 'tax_number'] }, tenantId }
            });
            const s: Record<string, string> = {};
            zatcaSettings.forEach((st: any) => { s[st.key] = st.value ?? ''; });
            
            if (s['company_name'] && s['tax_number']) {
                zatcaQr = generateZatcaQRContent({
                    sellerName: s['company_name'],
                    vatNumber: s['tax_number'],
                    timestamp: invoice.newInvoice.date.toISOString(),
                    totalWithVat: finalTotal,
                    vatAmount: tax,
                });
                
                // Save it to the database so it's persisted for Phase 1 display
                await prisma.salesInvoice.updateMany({
                    where: { id: invoice.newInvoice.id, tenantId },
                    data: { zatcaQr }
                });
            }
        } catch (qrErr: unknown) {
            log.warn('Zatca QR generation failed in POS:', qrErr);
        }

        // Return a Stringified invoice number and the QR for the frontend
        return NextResponse.json({ 
            success: true, 
            invoice: { 
                id: invoice.newInvoice.id,
                invoiceNumber: invoice.formattedInvoiceNo,
                zatcaQr 
            } 
        });

    } catch (error: any) {
        log.error("POS Checkout error:", error);
        return NextResponse.json({ success: false, error: 'حدث خطأ أثناء معالجة الدفع: ' + error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
