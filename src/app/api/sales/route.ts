import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2, validateMoney } from '@/lib/money';
import { postSalesInvoice } from '@/lib/auto-journal';
import { initializeZatca, generateZatcaQR, getQrCodeContent, generateZATCAXml, generateZatcaQRContent, InvoiceData, InvoiceLine } from '@/lib/zatca';
import { ZatcaJavaAdapter } from '@/lib/zatca-java';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';
import { resolveStockAndBranch } from '@/lib/getDefaults';
import { z } from 'zod';
import { checkQuota, quotaErrorResponse } from '@/lib/quotaGuard';
import { logDelete, auditContextFromRequest } from '@/lib/field-audit';
import { logger } from '@/lib/logger';

const log = logger.child({ route: 'sales' });
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { withTransaction } from '@/lib/db/transaction';

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

        const where: Record<string, unknown> = {};
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

async function _POST(request: Request) {

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        
        const parsed = SalesInvoiceSchema.safeParse(rawBody);
        if (!parsed.success) {
            return apiError({ message: 'بيانات غير صالحة', errors: parsed.error.format() }, 'تأكد من إدخال جميع الحقول بشكل صحيح', { status: 400 });
        }
        const body = parsed.data;

        log.debug('Received sales payload', { manualDate: body.manualDate, manualInvoiceNo: body.manualInvoiceNo });

        // --- Quota Guard (Trial + Invoice Limit) ---
        const tenant = (request as any).headers?.get?.('x-tenant') ||
            (request instanceof Request ? request.headers.get('x-tenant') : null);
        if (tenant) {
            const quotaCheck = await checkQuota(tenant, 'invoice');
            if (!quotaCheck.allowed) return quotaErrorResponse(quotaCheck);
        }
        // ------------------------------------------

        // Get next invoice number
        const lastInvoice = await prisma.salesInvoice.findFirst({
            orderBy: { invoiceNo: 'desc' },
        });
        const invoiceNo = body.manualInvoiceNo ? Number(body.manualInvoiceNo) : ((lastInvoice?.invoiceNo || 0) + 1);
        const invoiceDate = body.manualDate ? new Date(body.manualDate) : new Date();

        // ── Credit Limit Enforcement ────────────────────────────────────────
        if (body.customerId) {
            const customer = await prisma.customer.findUnique({
                where: { id: Number(body.customerId) },
                select: { creditLimit: true, balance: true, name: true },
            });
            if (customer && n(customer.creditLimit) > 0) {
                // Calculate invoice total estimate for check
                let estTotal = 0;
                for (const item of body.items) {
                    const p = Number(item.price) || 0;
                    const q = Number(item.quantity) || 1;
                    estTotal += p * q;
                }
                const paymentType = body.paymentType || 'cash';
                const paid = body.paid !== undefined ? Number(body.paid) : estTotal;
                const willBeOwed = estTotal - paid; // ما سيبقى ديناً على العميل
                const currentBalance = n(customer.balance); // رصيد حالي (ديون قائمة)
                if (paymentType !== 'cash' && (currentBalance + willBeOwed) > n(customer.creditLimit)) {
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
        // ────────────────────────────────────────────────────────────────────

        // Calculate totals — support dynamic tax rate and inclusive/exclusive VAT mode
        const bodyTaxRate = body.taxRate !== undefined ? Number(body.taxRate) : 15; // rate sent from frontend settings
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
            userId ? (await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } }))?.branchId ?? null : null
        );
        const { stockId: resolvedStockId, branchId } = await resolveStockAndBranch(
            body.stockId,
            userBranchFallback
        );

        
        const invoice = await prisma.$transaction(async (tx: any) => {
            // [ZATCA ICV RACE CONDITION FIX] Lock the zatca counter rows exclusively in this transaction
            await tx.$executeRaw`SELECT id FROM "settings" WHERE "key" IN ('zatca_invoice_counter', 'zatca_last_pih') FOR UPDATE`;

            const createdInvoice = await tx.salesInvoice.create({
                data: {
                    date: invoiceDate,
                    branchId,
                    invoiceNo,
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
            const allowNegativeStock = await tx.setting.findUnique({ where: { key: 'POS_ALLOW_NEGATIVE_STOCK' } });
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

                const prod = await tx.product.findUnique({ where: { id: productId }, select: { currentStock: true, buyPrice: true } });
                const baseStock = n(prod?.currentStock);
                const unitsStock = pUnits.reduce((s: any, u: any) => s + Number((u as any).unitStock || 0) * u.factor, 0);
                const totalBase = baseStock + unitsStock;
                
                totalCost += (n(prod?.buyPrice) || 0) * qtyInBase;

                if (!canGoNegative && qtyInBase > totalBase) {
                    throw new Error(`نفد مخزون الصنف ${item.productName}`);
                }

                await tx.product.update({
                    where: { id: productId },
                    data: { currentStock: { decrement: qtyInBase } },
                });

                const refreshed = await tx.product.findUnique({ where: { id: productId }, select: { currentStock: true } });
                let deficit = Math.abs(Math.min(0, n(refreshed?.currentStock || 0)));

                for (const pu of pUnits) {
                    if (deficit <= 0) break;
                    if ((pu as any).unitStock <= 0) continue;
                    const toBreak = Math.min(Math.ceil(deficit / n(pu.factor)), Number((pu as any).unitStock || 0));
                    await tx.productUnit.update({
                        where: { id: pu.id },
                        data: { unitStock: { decrement: toBreak } } as any,
                    });
                    await tx.product.update({
                        where: { id: productId },
                        data: { currentStock: { increment: toBreak * n(pu.factor) } },
                    });
                    deficit = Math.max(0, deficit - toBreak * n(pu.factor));
                }

                try {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId, stockId: createdInvoice.stockId } },
                        update: { quantity: { decrement: qtyInBase } },
                        create: { productId, stockId: createdInvoice.stockId, quantity: -qtyInBase },
                    });
                    
                    await tx.stockMovement.create({
                        data: {
                            productId: productId,
                            stockId: createdInvoice.stockId,
                            type: 'out',
                            quantity: qtyInBase,
                            referenceType: 'sales_invoice',
                            referenceId: createdInvoice.id,
                            userId: userId,
                            notes: `فاتورة مبيعات #${invoiceNo}`
                        }
                    });
                } catch (e: any) { log.error('ProductStock update failed', { err: e?.message }); }

                try {
                    const activeRecipe = await tx.recipe.findFirst({
                        where: { finishedProductId: Number(item.productId), isActive: true },
                        include: { ingredients: true }
                    });

                    if (activeRecipe && activeRecipe.ingredients.length > 0) {
                        for (const ing of activeRecipe.ingredients) {
                            const requiredQty = ing.quantity * qty;
                            
                            await tx.product.update({
                                where: { id: ing.rawProductId },
                                data: { currentStock: { decrement: requiredQty } }
                            });

                            await tx.productStock.upsert({
                                where: { productId_stockId: { productId: ing.rawProductId, stockId: createdInvoice.stockId } },
                                update: { quantity: { decrement: requiredQty } },
                                create: { productId: ing.rawProductId, stockId: createdInvoice.stockId, quantity: -requiredQty }
                            });
                        }
                    }
                } catch (recipeErr: unknown) {
                    log.error('Failed to auto-deduct recipe ingredients', { err: (recipeErr as any)?.message });
                }
            }

            // [STATE MACHINE AUDIT FIX] Ensure POS creations are properly logged in the audit trail
            try {
                await tx.auditLog.create({
                    data: {
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
                        await tx.treasury.create({
                            data: { type: 'in', amount: sCash, description: `تحصيل نقدي - فاتورة مبيعات #${invoiceNo}`, referenceType: 'sale', referenceId: createdInvoice.id, userId, branchId },
                        });
                    }
                    if (sCard > 0) {
                        await tx.treasury.create({
                            data: { type: 'in', amount: sCard, description: `مسدد بالشبكة - فاتورة مبيعات #${invoiceNo}`, referenceType: 'sale', referenceId: createdInvoice.id, userId, branchId },
                        });
                    }
                } else {
                    await tx.treasury.create({
                        data: {
                            type: 'in',
                            amount: paid,
                            description: `فاتورة مبيعات #${invoiceNo}`,
                            referenceType: 'sale',
                            referenceId: createdInvoice.id,
                            userId,
                            branchId,
                        },
                    });
                }
            }

            // --- ZATCA Phase 2: ATOMIC GENERATION & SIGNING ---
            let zatcaSignOutput: any = null;
            let invoiceDataObjForZatca: any = null;
            let zatcaSettingsObjForZatca: any = null;
            let isStandardInvoice = false;
            let invoiceUuidStr = '';
            let zatcaQRStr = '';
            const finalSettings: Record<string, string> = {};

            try {
                const zatcaSettings = await tx.setting.findMany({ take: 100,
                    where: { key: { in: ['company_name', 'company_name_en', 'tax_number', 'zatca_crn', 'zatca_street', 'zatca_building', 'zatca_district', 'zatca_city', 'zatca_city_en', 'zatca_postal_code', 'zatca_private_key', 'zatca_certificate', 'zatca_enabled', 'zatca_production_token', 'zatca_production_secret', 'zatca_environment', 'zatca_last_pih', 'zatca_invoice_counter', 'tax_rate', 'POS_TAX_INCLUSIVE'] } }
                });
                
                zatcaSettings.forEach((st: any) => { finalSettings[st.key] = st.value ?? ''; });

                if (finalSettings['zatca_enabled'] === '1' && finalSettings['company_name'] && finalSettings['tax_number']) {
                    if (finalSettings['zatca_production_token'] && finalSettings['zatca_private_key']) {
                        const crypto = require('crypto');
                        const certParsed = Buffer.from(finalSettings['zatca_production_token'], 'base64').toString('ascii');
                        
                        const counterKey = 'zatca_invoice_counter';
                        const currentCounter = parseInt(finalSettings[counterKey] || '0') + 1;
                        const prevHash = finalSettings['zatca_last_pih'] || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
                        
                        const nowUtc = new Date();
                        const saudiOffset = 3 * 60 * 60 * 1000;
                        const saudiNow = new Date(nowUtc.getTime() + saudiOffset);
                        const issueDate = saudiNow.toISOString().split('T')[0];
                        const issueTime = saudiNow.toISOString().split('T')[1]?.substring(0, 8) || '00:00:00';
                        const invoiceUuid = crypto.randomUUID();
                        invoiceUuidStr = invoiceUuid;
                        const taxRate = parseFloat(finalSettings['tax_rate'] || '15') / 100;
                        
                        const { ZatcaSigner } = await import('@/lib/zatca-signer');
                        const { decrypt } = await import('@/lib/encryption');
                        const signer = new ZatcaSigner();
                        const decryptedPrivateKey = decrypt(finalSettings['zatca_private_key']);
                        
                        const zatcaSettingsObj = {
                            companyName: finalSettings['company_name'],
                            companyNameEn: finalSettings['company_name_en'] || finalSettings['company_name'],
                            taxNumber: finalSettings['tax_number'],
                            crn: finalSettings['zatca_crn'] || '1010010000',
                            street: finalSettings['zatca_street'] || 'Main',
                            building: finalSettings['zatca_building'] || '1234',
                            district: finalSettings['zatca_district'] || 'District',
                            city: finalSettings['zatca_city'] || 'Riyadh',
                            cityEn: finalSettings['zatca_city_en'] || 'Riyadh',
                            postalCode: finalSettings['zatca_postal_code'] || '12345',
                            privateKey: decryptedPrivateKey,
                            certificate: certParsed,
                            productionToken: finalSettings['zatca_production_token'],
                            productionSecret: finalSettings['zatca_production_secret'] || '',
                            environment: (finalSettings['zatca_environment'] as 'sandbox' | 'simulation' | 'production') || 'production',
                            lastPih: prevHash,
                            invoiceCounter: currentCounter,
                        };
                        zatcaSettingsObjForZatca = zatcaSettingsObj;

                        const isTaxInclusive = finalSettings['POS_TAX_INCLUSIVE'] !== 'false';
                        const mappedLines = items.map((item: any) => {
                            const rawPrice = parseFloat(item.price) || 0;
                            const qty = parseFloat(item.quantity) || 1;
                            const exclPrice = isTaxInclusive
                                ? parseFloat((rawPrice / (1 + taxRate)).toFixed(2))
                                : rawPrice;
                            const lineTotal = isTaxInclusive
                                ? parseFloat((rawPrice * qty).toFixed(2))
                                : parseFloat((rawPrice * qty * (1 + taxRate)).toFixed(2));
                            return {
                                name: item.productName || item.name || 'Item',
                                quantity: qty,
                                unitPrice: exclPrice,
                                taxRate,
                                taxAmount: parseFloat((exclPrice * qty * taxRate).toFixed(2)),
                                subtotal: parseFloat((exclPrice * qty).toFixed(2)),
                                total: lineTotal,
                            };
                        });

                        const cust = (createdInvoice as any).customer;
                        const isStandard = !!(body.customerId && cust?.taxNumber);
                        isStandardInvoice = isStandard;

                        const invoiceDataObj = {
                            id: createdInvoice.invoiceNo?.toString() || createdInvoice.id.toString(),
                            uuid: invoiceUuid,
                            issueDate,
                            issueTime,
                            invoiceTypeCode: (body.docType === 'standard_debit' || body.docType === 'simplified_debit') ? '383' : '388',
                            invoiceTypeName: isStandard ? '0100000' : '0200000',
                            cancelation: (body.docType === 'standard_debit' || body.docType === 'simplified_debit') && body.originalInvoiceId ? {
                                canceled_invoice_number: Number(body.originalInvoiceId),
                                reason: body.notes || 'تعديل مبيعات'
                            } : undefined,
                            currencyCode: 'SAR',
                            taxCurrencyCode: 'SAR',
                            note: body.notes || (isStandard ? 'B2B Standard Sales Invoice' : 'B2C Simplified Sales Invoice'),
                            supplier: {
                                companyID: finalSettings['zatca_crn'] || '1010010000',
                                registrationName: finalSettings['company_name'] || finalSettings['tax_number'],
                                taxNumber: finalSettings['tax_number'],
                                address: {
                                    streetName: finalSettings['zatca_street'] || 'Main',
                                    buildingNumber: finalSettings['zatca_building'] || '1234',
                                    citySubdivisionName: finalSettings['zatca_district'] || 'District',
                                    cityName: finalSettings['zatca_city_en'] || finalSettings['zatca_city'] || 'Riyadh',
                                    postalZone: finalSettings['zatca_postal_code'] || '12345',
                                    countryCode: 'SA',
                                },
                            },
                            customer: isStandard ? {
                                companyID: cust?.crNo || '300000000000003',
                                registrationName: cust?.name || 'Customer',
                                taxNumber: cust?.taxNumber,
                                address: {
                                    streetName: cust?.street || 'Test', 
                                    buildingNumber: cust?.buildingNumber || '1111',
                                    citySubdivisionName: cust?.district || 'Test', 
                                    cityName: cust?.city || 'Riyadh',
                                    postalZone: cust?.postalCode || '11111', 
                                    countryCode: 'SA',
                                },
                            } : {
                                companyID: '300000000000003',
                                registrationName: cust?.name || 'Cash Customer',
                                address: {
                                    streetName: 'Test', buildingNumber: '1111',
                                    citySubdivisionName: 'Test', cityName: 'Riyadh',
                                    postalZone: '11111', countryCode: 'SA',
                                },
                            },
                            invoiceLines: mappedLines,
                            taxAmount: taxValue.toFixed(2),
                            totalAmount: total.toFixed(2),
                        };
                        invoiceDataObjForZatca = invoiceDataObj;

                        let signOutput;
                        if (isStandard && finalSettings['zatca_certificate'] && finalSettings['zatca_private_key']) {
                            const { generateZATCAXml } = await import('@/lib/zatca');
                            const { ZatcaJavaAdapter } = await import('@/lib/zatca-java');
                            
                            const mappedZatcaData = {
                                profileID: 'reporting:1.0',
                                id: invoiceDataObj.id,
                                uuid: invoiceUuid,
                                issueDate: issueDate,
                                issueTime: issueTime,
                                invoiceTypeCode: invoiceDataObj.invoiceTypeCode,
                                invoiceTypeName: invoiceDataObj.invoiceTypeName,
                                note: invoiceDataObj.note,
                                currencyCode: invoiceDataObj.currencyCode,
                                taxCurrencyCode: invoiceDataObj.taxCurrencyCode,
                                supplier: invoiceDataObj.supplier,
                                customer: invoiceDataObj.customer,
                                taxAmount: invoiceDataObj.taxAmount,
                                totalAmount: invoiceDataObj.totalAmount,
                                previousHash: prevHash,
                                cancelation: invoiceDataObj.cancelation,
                                invoiceLines: invoiceDataObj.invoiceLines.map((line: any, idx: number) => ({
                                    id: (idx + 1).toString(),
                                    quantity: line.quantity.toString(),
                                    unitCode: 'PCE',
                                    lineExtensionAmount: line.subtotal.toString(),
                                    itemName: line.name,
                                    taxPercent: (line.taxRate * 100).toString(),
                                }))
                            };

                            const rawXml = generateZATCAXml(mappedZatcaData as any);
                            const javaAdapter = new ZatcaJavaAdapter();
                            const signedData = await javaAdapter.signInvoice(
                                rawXml, 
                                finalSettings['zatca_certificate'], 
                                decryptedPrivateKey, 
                                mappedZatcaData.previousHash
                            );
                            signOutput = {
                                signedXml: signedData.signedXml,
                                hash: signedData.hash,
                                qr: signedData.qr,
                                encodedInvoice: Buffer.from(signedData.signedXml).toString('base64')
                            };
                        } else {
                            signOutput = signer.signInvoice(invoiceDataObj, zatcaSettingsObj);
                        }
                        
                        zatcaSignOutput = signOutput;
                        zatcaQRStr = signOutput.qr;
                        const hashFinal = signOutput.hash;
                        
                        // ATOMIC WRITE IN THE SAME SERIALIZABLE TRANSACTION
                        await tx.setting.upsert({ where: { key: 'zatca_last_pih' }, update: { value: hashFinal }, create: { key: 'zatca_last_pih', value: hashFinal, description: 'ZATCA Last PIH' } });
                        await tx.setting.upsert({ where: { key: counterKey }, update: { value: currentCounter.toString() }, create: { key: counterKey, value: currentCounter.toString(), description: 'ZATCA Counter' } });
                        await tx.salesInvoice.update({ where: { id: createdInvoice.id }, data: { zatcaStatus: 'signed', zatcaHash: hashFinal, zatcaQr: zatcaQRStr, zatcaXml: signOutput.signedXml } });
                        
                    } else {
                        const qrData = generateZatcaQRContent({
                            sellerName: finalSettings['company_name'],
                            vatNumber: finalSettings['tax_number'],
                            timestamp: createdInvoice.date.toISOString(),
                            totalWithVat: total,
                            vatAmount: taxValue,
                        });
                        zatcaQRStr = qrData;
                        await tx.salesInvoice.update({ where: { id: createdInvoice.id }, data: { zatcaQr: zatcaQRStr } });
                    }
                }
            } catch (zatcaErr: unknown) {
                log.warn('ZATCA process skipped/failed within transaction', { err: (zatcaErr as any)?.message });
            }

            return { createdInvoice, totalCost, zatcaSignOutput, invoiceDataObjForZatca, zatcaSettingsObjForZatca, isStandardInvoice, invoiceUuidStr, zatcaQRStr, finalSettings };
        }, { isolationLevel: 'Serializable' });

        // Auto-journal entry
        try {
            await postSalesInvoice({
                invoiceNo,
                subtotal: afterDiscount,
                taxValue,
                total,
                paymentType: body.paymentType || 'cash',
                splitCash: body.splitCash ? Number(body.splitCash) : 0,
                splitCard: body.splitCard ? Number(body.splitCard) : 0,
                userId: userId || undefined,
                branchId: branchId || undefined,
                discountValue,
                totalCost: invoice.totalCost,
                date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
        } catch (journalErr: unknown) {
            log.warn('Auto-journal for sale skipped', { err: (journalErr as any)?.message });
        }

        // ZATCA Reporting (Network Call) Deferred out of Transaction
        if (invoice.zatcaSignOutput && invoice.finalSettings && invoice.finalSettings['zatca_production_secret']) {
            try {
                const { ZatcaSigner } = await import('@/lib/zatca-signer');
                const signer = new ZatcaSigner();
                const zatcaResult = invoice.isStandardInvoice
                    ? await signer.clearInvoice(invoice.zatcaSignOutput.signedXml, invoice.zatcaSignOutput.hash, invoice.invoiceUuidStr, invoice.zatcaSettingsObjForZatca)
                    : await signer.reportInvoice(invoice.zatcaSignOutput.signedXml, invoice.zatcaSignOutput.hash, invoice.invoiceUuidStr, invoice.zatcaSettingsObjForZatca);

                if (zatcaResult.status === 'reported' || zatcaResult.status === 'cleared') {
                    await prisma.salesInvoice.update({ 
                        where: { id: invoice.createdInvoice.id }, 
                        data: { 
                            zatcaStatus: zatcaResult.status,
                            ...((zatcaResult as any).clearedInvoice ? { zatcaXml: Buffer.from((zatcaResult as any).clearedInvoice, 'base64').toString('utf-8') } : {})
                        } 
                    });
                } else {
                    await prisma.salesInvoice.update({ where: { id: invoice.createdInvoice.id }, data: { zatcaStatus: 'failed', zatcaResponse: JSON.stringify(zatcaResult.validationResults) } });
                }
            } catch (reportErr: any) {
                log.error('src/app/api/sales/route.ts', { error: reportErr instanceof Error ? reportErr.message : reportErr });

                await prisma.salesInvoice.update({ where: { id: invoice.createdInvoice.id }, data: { zatcaStatus: 'failed', zatcaResponse: reportErr.message } });
            }
        }

        return NextResponse.json({ success: true, ...invoice.createdInvoice, zatcaQR: invoice.zatcaQRStr }, { status: 201 });

    } catch (error: any) {
        log.error('Sales create error', { err: error?.message });
        return NextResponse.json({ error: 'فشل في إنشاء الفاتورة' }, { status: 500 });
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
            
            const result = await prisma.$transaction(async (tx: any) => {
                // Reverse stock
                for (const inv of allSales) {
                    for (const detail of inv.details) {
                        try {
                            await tx.product.update({
                                where: { id: detail.productId },
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
                
                await tx.journalEntry.deleteMany({
                    where: { reference: { startsWith: 'SALE-' } }
                });

                await tx.salesInvoiceDetail.deleteMany({});
                await tx.treasury.deleteMany({ where: { referenceType: 'sale' } });
                return await tx.salesInvoice.deleteMany({});
            });
            return NextResponse.json({ success: true, message: `تم حذف ${result.count} فاتورة مبيعات مع عكس المخزون والقيود المحاسبية` });
        }

        // Single invoice delete
        const allowed = await hasPermission(auth.userId, 'delete_invoices', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف الفواتير' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'معرف الفاتورة مطلوب' }, { status: 400 });

        const invoice = await prisma.salesInvoice.findUnique({ where: { id }, include: { details: true } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        await prisma.$transaction(async (tx: any) => {
            // Reverse stock (re-increment what was sold) safely for both global and warehouse stock
            for (const detail of invoice.details) {
                await tx.product.update({
                    where: { id: detail.productId },
                    data: { currentStock: { increment: detail.quantity } },
                });
                
                try {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: detail.productId, stockId: invoice.stockId } },
                        update: { quantity: { increment: detail.quantity } },
                        create: { productId: detail.productId, stockId: invoice.stockId, quantity: detail.quantity },
                    });
                } catch (e: any) {
                     log.error('Failed to reverse productStock for sales delete inside tx', { err: e?.message });
                }
            }

            // Remove related treasury entries
            await tx.treasury.deleteMany({ where: { referenceType: 'sale', referenceId: id } });

            await tx.journalEntry.deleteMany({
                where: { reference: `SALE-${invoice.invoiceNo}` }
            });

            // Write to AuditLog for AI Fraud Engine
            await tx.auditLog.create({
                data: {
                    userId: auth.userId,
                    action: 'DELETE_SALES_INVOICE',
                    tableName: 'SalesInvoice',
                    recordId: String(id),
                    details: JSON.stringify({ invoiceNo: invoice.invoiceNo, total: invoice.total, subtotal: invoice.subtotal, items: invoice.details.length })
                }
            });

            // Delete invoice (cascade deletes details)
            await tx.salesInvoice.delete({ where: { id } });
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
export const GET    = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST   = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
