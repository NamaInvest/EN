import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runRetentionCleanup(dryRun = true) {
    console.log(`[Retention Cleanup] Starting cron job (DryRun: ${dryRun})...`);

    const SEVEN_YEARS_AGO = new Date();
    SEVEN_YEARS_AGO.setFullYear(SEVEN_YEARS_AGO.getFullYear() - 7);
    
    const NINETY_DAYS_AGO = new Date();
    NINETY_DAYS_AGO.setDate(NINETY_DAYS_AGO.getDate() - 90);

    try {
        // 1. Audit Logs cleanup (90 days)
        // @ts-ignore
        if (prisma.auditLog) {
            // @ts-ignore
            const logsToDelete = await prisma.auditLog.count({
                where: { createdAt: { lt: NINETY_DAYS_AGO } }
            });
            console.log(`Found ${logsToDelete} old audit logs to delete.`);
            
            if (!dryRun && logsToDelete > 0) {
                // @ts-ignore
                await prisma.auditLog.deleteMany({
                    where: { createdAt: { lt: NINETY_DAYS_AGO } }
                });
            }
        }

        // 2. Financial records older than 7 years (ZATCA rules)
        // Usually we archive these to cold storage, not hard delete.
        // @ts-ignore
        if (prisma.journalEntry) {
            // @ts-ignore
            const oldJournals = await prisma.journalEntry.count({
                where: { date: { lt: SEVEN_YEARS_AGO } }
            });
            console.log(`Found ${oldJournals} financial journals eligible for cold storage archiving.`);
            // ... triggering AWS Glacier archive ...
        }

    } catch (e) {
        console.error('Failed to run retention cleanup', e);
    }

    console.log('[Retention Cleanup] Done.');
}

if (require.main === module) {
    runRetentionCleanup(true);
}
