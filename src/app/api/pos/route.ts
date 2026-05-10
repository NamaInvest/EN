import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

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

            // C. Update ProductStock balances & Create StockMovement
            for (const item of details) {
                // Update Stock
                const currentStock = await tx.productStock.findFirst({
                    where: { productId: item.productId, stockId: stockId }
                });

                if (currentStock) {
                    await tx.productStock.update({
                        where: { id: currentStock.id },
                        data: { quantity: currentStock.quantity - item.quantity }
                    });
                } else {
                    // Create if not exists with negative balance (or throw error)
                    await tx.productStock.create({
                        data: {
                            productId: item.productId,
                            stockId: stockId,
                            quantity: -item.quantity
                        }
                    });
                }

                // Create Stock Movement Audit Record
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        stockId: stockId,
                        type: "out",
                        quantity: item.quantity,
                        referenceType: "SalesInvoice",
                        referenceId: invoice.id,
                        userId: userId,
                        notes: `POS Sale - Invoice ${invoice.id}`
                    }
                });
            }

            // D. Create ZATCARecord for the electronic invoicing integration
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

        return NextResponse.json({
            success: true,
            message: "POS Transaction Completed Successfully",
            data: result
        }, { status: 201 });

    } catch (error: any) {
        log.error("POS API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process POS transaction",
            details: error.message
        }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
