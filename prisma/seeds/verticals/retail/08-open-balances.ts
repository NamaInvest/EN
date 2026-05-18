import { PrismaClient } from '@prisma/client';

export async function seedBalances(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding Open Balances (AR/AP/Cash)...');

    const customers = await prisma.customer.findMany({ where: { tenantId }, take: 2 });
    if (customers.length < 2) return;

    const dateStr = new Date().toISOString().split('T')[0];
    
    // Get or create Stock
    let stock = await prisma.stock.findFirst({ where: { tenantId } });
    if (!stock) {
        stock = await prisma.stock.create({ data: { name: 'المستودع الرئيسي', tenantId } });
    }
    const stockId = stock.id;

    try {
        // 1. AR Open Balance (Unpaid Sales Invoice)
        await prisma.salesInvoice.create({
            data: {
                tenantId,
                invoiceNo: 9991,
                date: new Date(),
                customerId: customers[0].id,
                subtotal: 1000,
                taxValue: 150,
                total: 1150,
                paid: 0,
                remaining: 1150,
                paymentType: 'credit',
                status: 'completed',
                docType: 'invoice',
                stockId
            }
        });

        // 2. AP Open Balance (Unpaid Purchase Invoice)
        await prisma.purchaseInvoice.create({
            data: {
                tenantId,
                invoiceNo: 9992,
                date: new Date(),
                supplierId: customers[1].id, // fallback schema mapping
                subtotal: 2000,
                taxValue: 300,
                total: 2300,
                paid: 0,
                remaining: 2300,
                paymentType: 'credit',
                status: 'completed',
                stockId
            }
        });

        // 3. Cash/Bank Opening Balances Journal
        await prisma.journalEntry.create({
            data: {
                tenantId,
                entryNumber: 'OB-001',
                entryDate: dateStr,
                description: 'أرصدة افتتاحية - نقدية وبنوك',
                totalDebit: 100000,
                totalCredit: 100000,
                lines: {
                    create: [
                        { accountId: 1, debit: 50000, credit: 0, description: 'كاش' },
                        { accountId: 1, debit: 50000, credit: 0, description: 'بنك' },
                        { accountId: 2, debit: 0, credit: 100000, description: 'رأس المال' }
                    ]
                }
            }
        }).catch(() => null);

    } catch (e: any) {
        console.error('Failed to seed open balances', e.message);
    }
}