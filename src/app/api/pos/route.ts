import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';
import { postSalesInvoice } from '@/lib/auto-journal';
import { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } from '@/lib/idempotency';

const log = logger.child({ service: 'pos' });


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  stockId: z.union([z.string(), z.number()]).optional(),
  paymentType: z.any().optional(),
  notes: z.any().optional(),
  details: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        // 1. Multi-tenant Validation: Extract tenant safely
        // Note: Our prisma setup in '@/lib/prisma' already routes to the correct DB based on 'x-tenant'
        const tenantString = resolveTenant(req as any);
        if (!tenantString) {
            return NextResponse.json({ error: "Missing or invalid Tenant ID" }, { status: 401 });
        }

        const idempotencyKey = req.headers.get('x-idempotency-key');
        if (!idempotencyKey) {
            return NextResponse.json({ error: "Missing x-idempotency-key header. Required for POS operations." }, { status: 400 });
        }

        const isUnique = await lockIdempotencyKey(tenantString, 'pos_post', idempotencyKey);
        if (!isUnique) {
            return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
        }

        // Parse Request Body
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const {
            customerId,
            stockId = 1,
            paymentType = "cash",
            notes,
            details, // Array of SalesInvoiceDetail
            userId
        } = body;

        if (!details || !Array.isArray(details) || details.length === 0) {
            return NextResponse.json({ error: "Invoice must contain at least one detail line." }, { status: 400 });
        }

        // Calculate Totals safely
        let subtotal = 0;
        let taxValue = 0;
        let total = 0;

        for (const item of details) {
            subtotal += item.total || (item.quantity * item.price);
            taxValue += item.taxValue || ((item.quantity * item.price) * (item.taxRate || 15) / 100);
            total += item.total + item.taxValue || ((item.quantity * item.price) * (1 + (item.taxRate || 15) / 100));
        }

        // 2. Perform POS Transaction (Invoice, Details, ZATCA Record, and Stock)
        // Using Prisma $transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx: any) => {
            // A. Create the Main Invoice Header
            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: Math.floor(Math.random() * 1000000), // Auto-generate or sequence
                    customerId,
                    stockId,
                    subtotal,
                    taxValue,
                    total,
                    paid: paymentType === "cash" ? total : 0,
                    remaining: paymentType === "cash" ? 0 : total,
                    paymentType,
                    status: "completed",
                    userId,
                    notes,
                    zatcaStatus: "pending", // Legacy field compatibility
                }
            });

            // B. Persist SalesInvoiceDetail line-items
            const lineItems = await Promise.all(details.map(async (item: any) => {
                return tx.salesInvoiceDetail.create({
                    data: {
                        invoiceId: invoice.id,
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price,
                        discountRate: item.discountRate || 0,
                        discountValue: item.discountValue || 0,
                        taxRate: item.taxRate || 15,
                        taxValue: item.taxValue || ((item.quantity * item.price) * 0.15),
                        total: item.total || (item.quantity * item.price),
                    }
                });
            }));

            // C. Update ProductStock balances, currentStock, and calculate COGS
            let totalCost = 0;
            for (const item of details) {
                const parsedProductId = parseInt(item.productId);
                
                // 1. Fetch product to get buyPrice for COGS
                const prod = await tx.product.findUnique({ where: { id: parsedProductId } });
                totalCost += (Number(prod?.buyPrice) || 0) * item.quantity;

                // 2. Global Stock Deduction
                await tx.product.update({
                    where: { id: parsedProductId },
                    data: { currentStock: { decrement: item.quantity } }
                });

                // 3. Warehouse Stock Deduction (ProductStock)
                await tx.productStock.upsert({
                    where: { productId_stockId: { productId: parsedProductId, stockId: parseInt(stockId) } },
                    update: { quantity: { decrement: item.quantity } },
                    create: { productId: parsedProductId, stockId: parseInt(stockId), quantity: -item.quantity }
                });

                // 4. Create Stock Movement Audit Record
                await tx.stockMovement.create({
                    data: {
                        productId: parsedProductId,
                        stockId: parseInt(stockId),
                        type: "out",
                        quantity: item.quantity,
                        referenceType: "SalesInvoice",
                        referenceId: invoice.id,
                        userId: userId || null,
                        notes: `POS Sale - Invoice ${invoice.id}`
                    }
                });
            }
            
            // D. Treasury Atomicity (Cash/Bank collection)
            if (paymentType === "cash" || paymentType === "bank") {
                await tx.treasury.create({
                    data: {
                        type: 'in',
                        amount: total,
                        description: `تحصيل ${paymentType === 'cash' ? 'نقدي' : 'شبكة'} - فاتورة POS #${invoice.invoiceNo}`,
                        referenceType: 'sale',
                        referenceId: invoice.id,
                        userId: userId || null,
                    }
                });
            } else if (paymentType === "split") {
                const sCash = Number(body.splitCash) || 0;
                const sCard = Number(body.splitCard) || 0;
                if (sCash > 0) {
                    await tx.treasury.create({
                        data: { type: 'in', amount: sCash, description: `تحصيل نقدي - فاتورة POS #${invoice.invoiceNo}`, referenceType: 'sale', referenceId: invoice.id, userId: userId || null },
                    });
                }
                if (sCard > 0) {
                    await tx.treasury.create({
                        data: { type: 'in', amount: sCard, description: `مسدد بالشبكة - فاتورة POS #${invoice.invoiceNo}`, referenceType: 'sale', referenceId: invoice.id, userId: userId || null },
                    });
                }
            }

            // E. Financial Journal Atomicity (postSalesInvoice)
            await postSalesInvoice({
                invoiceNo: invoice.invoiceNo,
                subtotal: invoice.subtotal,
                taxValue: invoice.taxValue,
                total: invoice.total,
                paymentType: invoice.paymentType,
                splitCash: Number(body.splitCash) || 0,
                splitCard: Number(body.splitCard) || 0,
                userId: invoice.userId || undefined,
                totalCost: totalCost,
                txClient: tx
            });

            // F. Create ZATCARecord for the electronic invoicing integration
            const zatcaRecord = await tx.zATCARecord.create({
                data: {
                    invoiceId: invoice.id,
                    invoiceType: "POS",
                    status: "sent",
                    // The ZATCA background worker will process this later and fill Hash, QR, XML
                }
            });

            return { invoice, lineItems, zatcaRecord };
        });

        await completeIdempotencyKey(tenantString, 'pos_post', idempotencyKey);

        return NextResponse.json({
            success: true,
            message: "POS Transaction Completed Successfully",
            data: result
        }, { status: 201 });

    } catch (error: any) {
        const tenantString = resolveTenant(req as any);
        const idempotencyKey = req.headers.get('x-idempotency-key');
        if (tenantString && idempotencyKey) {
            await unlockIdempotencyKey(tenantString, 'pos_post', idempotencyKey);
        }

        log.error("POS API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process POS transaction",
            details: error.message
        }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
