const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL.replace(/namasoft(\?|$)/, 'ahmedalyamicompany_db$1');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function run() {
  try {
    const salesCount = await prisma.salesInvoice.count();
    console.log('Sales Invoices:', salesCount);

    const journalCount = await prisma.journalEntry.count();
    console.log('Journal Entries:', journalCount);

    if (salesCount > 0) {
       const invoices = await prisma.salesInvoice.findMany({ select: { id: true, invoiceNumber: true, totalAmount: true, posted: true } });
       console.log('Invoices details:', invoices);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
