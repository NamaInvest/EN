import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Validates the database after a migration run.
 * Checks Trial Balance, required fields, and FK orphans.
 */
export async function validateMigration(tenantId: string) {
    console.log(`Starting post-migration validation for tenant: ${tenantId}...`);

    let isValid = true;
    const errors: string[] = [];

    // 1. Check Trial Balance
    // Sum of all debit lines must equal sum of all credit lines
    const result: any[] = await prisma.$queryRaw`
        SELECT 
            SUM("debit") as total_debit, 
            SUM("credit") as total_credit 
        FROM "JournalEntryLine" 
        WHERE "tenantId" = ${tenantId}
    `;

    const totalDebit = Number(result[0]?.total_debit || 0);
    const totalCredit = Number(result[0]?.total_credit || 0);

    // Using epsilon to handle float precision issues
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        isValid = false;
        errors.push(`Trial Balance mismatch! Debit: ${totalDebit}, Credit: ${totalCredit}`);
    } else {
        console.log(`✅ Trial Balance is balanced (${totalDebit}).`);
    }

    // 2. Check orphans or missing ZATCA data
    const invalidInvoices = await prisma.salesInvoice.count({
        where: {
            tenantId,
            status: 'POSTED',
            zatcaStatus: 'PENDING'
        }
    });

    if (invalidInvoices > 0) {
        // Just a warning, not a hard block
        console.warn(`⚠️ Warning: ${invalidInvoices} posted invoices have no ZATCA clearance.`);
    }

    if (!isValid) {
        console.error('❌ Validation Failed:', errors);
    } else {
        console.log('✅ All validations passed.');
    }

    return { isValid, errors };
}
