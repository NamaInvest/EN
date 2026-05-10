import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.payment-run.propose' });


const _POSTSchema = z.object({
  dueBefore: z.any().optional(),
  currency: z.any().optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { dueBefore, currency, bankAccountId } = body;

        // Fetch pending approved invoices
        const pendingInvoices = await prisma.purchaseInvoice.findMany({ take: 100,
            where: {
                status: 'APPROVED_FOR_PAYMENT',
                date: { lte: new Date(dueBefore) },
                supplierId: { not: null },
            },
            include: {
                supplier: true
            }
        });

        if (pendingInvoices.length === 0) {
            return NextResponse.json({ error: 'No approved invoices found for this criteria' }, { status: 400 });
        }

        // Group by vendor
        const groupedByVendor = new Map<number, any>();
        pendingInvoices.forEach(inv => {
            const supplierId = inv.supplierId!;
            if (!groupedByVendor.has(supplierId)) {
                groupedByVendor.set(supplierId, {
                    supplierId,
                    supplierName: inv.supplier!.name,
                    totalAmount: 0,
                    invoices: []
                });
            }
            const group = groupedByVendor.get(supplierId);
            group.totalAmount += inv.total;
            group.invoices.push(inv.id);
        });

        const totalAmount = Array.from(groupedByVendor.values()).reduce((sum: any, g: any) => sum + g.totalAmount, 0);

        // Create PaymentRun
        const run = await prisma.paymentRun.create({
            data: {
                status: 'PROPOSED',
                dueDateUntil: new Date(dueBefore),
                currency: currency || 'SAR',
                paymentMethod: 'BANK_TRANSFER',
                bankAccountId: Number(bankAccountId),
                totalAmount: totalAmount,
                totalCount: groupedByVendor.size,
                proposedAt: new Date(),
                lines: {
                    create: Array.from(groupedByVendor.values()).map(g => ({
                        supplierId: g.supplierId,
                        openItemIds: g.invoices, // We use openItemIds to store invoice IDs
                        invoiceCount: g.invoices.length,
                        amount: g.totalAmount,
                        currency: currency || 'SAR',
                        amountFunctional: g.totalAmount,
                        beneficiaryName: g.supplierName,
                        paymentMethod: 'BANK_TRANSFER',
                        status: 'PENDING'
                    }))
                }
            }
        });

        return NextResponse.json({ success: true, data: run });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
