import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data Retention Policy:
// Financial Records (ZATCA): 7 Years
// App Logs: 90 Days

async function runCleanup() {
    console.log('Starting automated Data Retention Cleanup...');
    const dryRun = process.env.DRY_RUN !== 'false'; // Defaults to true for safety

    if (dryRun) {
        console.log('⚠️ Running in DRY RUN mode. No data will actually be deleted.');
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    try {
        // Example: Cleaning up old TestRuns and App Logs (older than 90 days)
        const oldTestRuns = await prisma.testRun.count({
            where: { createdAt: { lt: ninetyDaysAgo } }
        });

        console.log(`Found ${oldTestRuns} TestRun records older than 90 days.`);

        if (!dryRun && oldTestRuns > 0) {
            await prisma.testRun.deleteMany({
                where: { createdAt: { lt: ninetyDaysAgo } }
            });
            console.log(`Deleted ${oldTestRuns} TestRun records.`);
        }

        // Example: Identifying old financial records (older than 7 years)
        // Normally we would archive them to S3/Glacier before deletion
        const oldInvoices = await prisma.salesInvoice.count({
            where: { createdAt: { lt: sevenYearsAgo } }
        });

        console.log(`Found ${oldInvoices} Sales Invoices older than 7 years.`);

        console.log('✅ Retention cleanup completed.');
    } catch (error) {
        console.error('Error during retention cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runCleanup();
