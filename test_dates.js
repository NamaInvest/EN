const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.salesInvoice.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: { id: true, invoiceNo: true, date: true }
    });
    console.log(JSON.stringify(invoices, null, 2));
}

main().finally(() => prisma.$disconnect());
