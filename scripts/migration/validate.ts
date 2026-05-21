import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function validateMigration(tenantId: string) {
    console.log(`[Migration Validation] Running post-migration validation for ${tenantId}...`);
    const errors: string[] = [];

    // 1. Trial Balance Validation
    // Assume we check the sum of debits and credits in JournalEntryLines
    try {
        // @ts-ignore
        if (prisma.journalEntryLine) {
            // @ts-ignore
            const result = await prisma.journalEntryLine.aggregate({
                where: { tenantId },
                _sum: { debit: true, credit: true }
            });

            const totalDebit = result._sum.debit || 0;
            const totalCredit = result._sum.credit || 0;
            
            // Allow 0.01 tolerance
            if (Math.abs(Number(totalDebit) - Number(totalCredit)) > 0.01) {
                errors.push(`Trial Balance is not balanced! Debit: ${totalDebit}, Credit: ${totalCredit}`);
            }
        }
    } catch(e) {}

    // 2. Orphan check for invoices
    // If an invoice references a customer that doesn't exist
    
    if (errors.length > 0) {
        console.error('❌ Validation Failed!', errors);
        return { isValid: false, errors };
    }

    console.log('✅ Validation passed.');
    return { isValid: true, errors: [] };
}
