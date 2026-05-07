const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const last = await prisma.purchaseInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = (last?.invoiceNo || 0) + 1;
        
        console.log('Attempting to create PurchaseInvoice...');
        const created = await prisma.purchaseInvoice.create({
            data: {
                invoiceNo,
                isManual: true,
                stockId: 1,
                subtotal: 100,
                taxValue: 15,
                total: 115,
                paid: 115,
                remaining: 0,
                paymentType: 'cash',
                status: 'completed',
                receiptStatus: 'received',
                ppvAmount: 0,
            }
        });
        console.log('Success!', created.id);
        
        await prisma.purchaseInvoice.delete({ where: { id: created.id } });
    } catch (e) {
        console.error('Error in create:', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
