import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'purchases.drop-ship' });
async function _POST(req: Request) {
    const prisma = getPrisma(req);
    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = requireTenantId(req as any);
        const { purchaseOrderId } = await req.json();

        // 1. Fetch PO and linked SO
        const po: any = await (prisma.purchaseOrder as any).findUnique({
            where: { id: parseInt(purchaseOrderId), tenantId },
            include: { details: true, salesOrder: { include: { details: true } } }
        });

        if (!po || !po.salesOrder) {
            return NextResponse.json({ error: 'Purchase Order or linked Sales Order not found' }, { status: 404 });
        }

        if (po.status === 'completed') {
            return NextResponse.json({ error: 'Drop Ship already confirmed' }, { status: 400 });
        }

        // Calculate Invoice Numbers BEFORE transaction
        const lastPi = await (prisma.purchaseInvoice as any).findFirst({ orderBy: { invoiceNo: 'desc' } });
        const newPiNo = lastPi ? lastPi.invoiceNo + 1 : 1000;

        const lastSi = await (prisma.salesInvoice as any).findFirst({ orderBy: { invoiceNo: 'desc' } });
        const newSiNo = lastSi ? lastSi.invoiceNo + 1 : 1000;

        const cogsAccountId = 5; // COGS
        const apAccountId = 2; // AP
        const arAccountId = 1; // AR
        const salesAccountId = 4; // Sales Revenue

        // Transactional Execution (Point 1: State Management)
        const [purchaseInvoice, salesInvoice] = await (prisma as any).$transaction([
            // 2. Generate Purchase Invoice
            (prisma.purchaseInvoice as any).create({
                data: {
                    tenantId,
                    invoiceNo: newPiNo,
                    supplierId: po.supplierId,
                    total: po.total,
                    paid: 0,
                    paymentType: 'credit',
                    notes: `فاتورة مشتريات (شحن مباشر) مرتبطة بأمر المبيعات #${po.salesOrder.orderNo} وطلب العميل #${po.salesOrder.id}`,
                    userId: auth.userId,
                    details: {
                        create: po.details.map((d: any) => ({
                            productId: d.productId,
                            productName: d.productName,
                            quantity: d.quantity,
                            price: d.price,
                            total: d.total
                        }))
                    }
                }
            }),

            // 3. Generate Sales Invoice
            (prisma.salesInvoice as any).create({
                data: {
                    tenantId,
                    invoiceNo: newSiNo,
                    customerId: po.salesOrder.customerId,
                    total: po.salesOrder.total,
                    paid: 0,
                    paymentType: 'credit',
                    notes: `فاتورة مبيعات (شحن مباشر) مرتبطة بأمر الشراء #${po.orderNo} وفاتورة المورد`,
                    userId: auth.userId,
                    isDropShip: true, // Mark invoice as Drop Ship for return logic
                    details: {
                        create: po.salesOrder.details.map((d: any) => ({
                            productId: d.productId,
                            productName: d.productName,
                            quantity: d.quantity,
                            price: d.price,
                            total: d.total
                        }))
                    }
                }
            }),

            // 4. Create Direct Journal Entry (COGS to AP, AR to Sales)
            (prisma.journalEntry as any).create({
                data: {
                    tenantId,
                    entryNumber: `DS-${po.orderNo}-${Date.now()}`,
                    entryDate: new Date().toISOString().split('T')[0],
                    description: `قيد شحن مباشر - Drop Ship (PO #${po.orderNo})`,
                    reference: `DS-${po.orderNo}`,
                    totalDebit: po.total + po.salesOrder.total,
                    totalCredit: po.total + po.salesOrder.total,
                    status: 'posted',
                    lines: {
                        create: [
                            { accountId: cogsAccountId, debit: po.total, credit: 0, description: 'Drop Ship COGS' },
                            { accountId: apAccountId, debit: 0, credit: po.total, description: 'Drop Ship AP' },
                            { accountId: arAccountId, debit: po.salesOrder.total, credit: 0, description: 'Drop Ship AR' },
                            { accountId: salesAccountId, debit: 0, credit: po.salesOrder.total, description: 'Drop Ship Sales' }
                        ]
                    }
                }
            }),

            // 5. Update Statuses
            (prisma.purchaseOrder as any).update({
                where: { id: po.id, tenantId },
                data: { status: 'completed' }
            }),

            (prisma.salesOrder as any).update({
                where: { id: po.salesOrder.id, tenantId },
                data: { status: 'invoiced' }
            })
        ]);

        return NextResponse.json({ 
            message: 'Drop Ship confirmed successfully',
            purchaseInvoiceId: purchaseInvoice.id,
            salesInvoiceId: salesInvoice.id
        });

    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Failed to confirm drop ship' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
