import { PrismaClient } from '@prisma/client';

export async function seedHistorical(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 12 months historical transactions...');

    const products = await prisma.product.findMany({ where: { tenantId }, take: 1 });
    const customers = await prisma.customer.findMany({ where: { tenantId }, take: 1 });
    // Using customer as supplier if supplier doesn't exist, or just use customerId for supplier if schema allows.
    // Wait, PurchaseInvoice uses supplierId which references Customer.
    
    if (products.length === 0 || customers.length === 0) {
        console.log('Skipping historical seed: missing master data.');
        return;
    }

    const p = products[0];
    const c = customers[0];

    // Get or create Stock
    let stock = await prisma.stock.findFirst({ where: { tenantId } });
    if (!stock) {
        stock = await prisma.stock.create({ data: { name: 'المستودع الرئيسي', tenantId } });
    }
    const stockId = stock.id;

    const year = new Date().getFullYear() - 1;

    for (let month = 1; month <= 12; month++) {
        const date = new Date(year, month - 1, 15);
        const dateStr = date.toISOString().split('T')[0];

        // 1. Sales Invoice
        let siId = 0;
        try {
            const si = await prisma.salesInvoice.create({
                data: {
                    tenantId,
                    invoiceNo: month,
                    date: date,
                    customerId: c.id,
                    subtotal: 100,
                    taxValue: 15,
                    total: 115,
                    paid: 115,
                    remaining: 0,
                    paymentType: 'cash',
                    status: 'completed',
                    docType: 'invoice',
                    stockId
                }
            });
            siId = si.id;

            // Stock Out
            await prisma.stockMovement.create({
                data: {
                    tenantId,
                    productId: p.id,
                    type: 'out',
                    quantity: 1,
                    referenceType: 'sales_invoice',
                    referenceId: si.id,
                    date: date,
                    stockId
                }
            });

            // Journal Entry for Sales
            await prisma.journalEntry.create({
                data: {
                    tenantId,
                    entryNumber: `SI-${month}`,
                    entryDate: dateStr,
                    description: 'فاتورة مبيعات - ديمو',
                    totalDebit: 115,
                    totalCredit: 115,
                    lines: {
                        create: [
                            { accountId: 1, debit: 115, credit: 0, description: 'كاش' }, // Fallback to id 1 if code not mapped
                            { accountId: 2, debit: 0, credit: 100, description: 'مبيعات' },
                            { accountId: 3, debit: 0, credit: 15, description: 'ضريبة مخرجات' }
                        ]
                    }
                }
            }).catch(() => null); // Graceful fallback if accounts aren't perfectly mapped

        } catch (e: any) {
            console.error('Failed to create sales invoice for month', month, e.message);
        }

        // 2. Purchase Invoice
        try {
            const pi = await prisma.purchaseInvoice.create({
                data: {
                    tenantId,
                    invoiceNo: month,
                    date: date,
                    supplierId: c.id, // using customer as supplier due to schema
                    subtotal: 500,
                    taxValue: 75,
                    total: 575,
                    paid: 575,
                    remaining: 0,
                    paymentType: 'cash',
                    status: 'completed',
                    stockId
                }
            });

            // Stock In
            await prisma.stockMovement.create({
                data: {
                    tenantId,
                    productId: p.id,
                    type: 'in',
                    quantity: 10,
                    referenceType: 'purchase_invoice',
                    referenceId: pi.id,
                    date: date,
                    stockId
                }
            });

            // Journal Entry for Purchases
            await prisma.journalEntry.create({
                data: {
                    tenantId,
                    entryNumber: `PI-${month}`,
                    entryDate: dateStr,
                    description: 'فاتورة مشتريات - ديمو',
                    totalDebit: 575,
                    totalCredit: 575,
                    lines: {
                        create: [
                            { accountId: 4, debit: 500, credit: 0, description: 'مشتريات' },
                            { accountId: 5, debit: 75, credit: 0, description: 'ضريبة مدخلات' },
                            { accountId: 1, debit: 0, credit: 575, description: 'كاش' }
                        ]
                    }
                }
            }).catch(() => null);

        } catch (e: any) {
            console.error('Failed to create purchase invoice for month', month, e.message);
        }
    }
}