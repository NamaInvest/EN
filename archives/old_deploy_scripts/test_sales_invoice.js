const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Attempting to create SalesInvoice...');
        const created = await prisma.salesInvoice.create({
            data: {
                invoiceNo: 999999,
                stockId: 1,
                subtotal: 100,
                taxValue: 15,
                total: 115,
                paid: 115,
                remaining: 0,
                paymentType: 'cash',
                status: 'completed',
            }
        });
        console.log('Success!', created.id);
        
        await prisma.salesInvoice.delete({ where: { id: created.id } });
    } catch (e) {
        console.error('Error in create:', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
