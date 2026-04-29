const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const count = await prisma.salesInvoice.count();
        console.log('Total invoices:', count);
        
        if (count > 0) {
            console.log('Attempting to delete all invoices...');
            await prisma.salesInvoiceDetail.deleteMany({});
            await prisma.treasury.deleteMany({ where: { referenceType: 'sale' } });
            await prisma.journalEntry.deleteMany({ where: { reference: { startsWith: 'SALE-' } } });
            
            const res = await prisma.salesInvoice.deleteMany({});
            console.log('Deleted invoices:', res.count);
        }
    } catch (e) {
        console.error('ERROR during deletion:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
