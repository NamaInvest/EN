import { FinancialTxClient } from '@/lib/db/transaction';
import { getNextNumber } from '@/lib/numbering';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting-journal-service' });

export type CreateJournalEntryDTO = {
    description: string;
    reference?: string;
    lines: Array<{
        accountId?: number;
        accountCode?: string;
        costCenterId?: number;
        debit: number;
        credit: number;
        foreignDebit?: number;
        foreignCredit?: number;
        description?: string;
        profitCenterId?: number;
        projectId?: number;
        segmentId?: number;
        productId?: number;
        customerId?: number;
        vendorId?: number;
        employeeId?: number;
        assetId?: number;
        bookId?: number;
        fxRate?: number;
        quantity?: number;
        uom?: string;
    }>;
    userId?: number;
    branchId?: number | null;
    date?: string;
    currencyId?: number | null;
    exchangeRate?: number;
    status?: string;
};

export class AccountingJournalService {
    /**
     * Get account ID by code
     */
    static async getAccountId(code: string, tx: FinancialTxClient): Promise<number | null> {
        const account = await tx.account.findFirst({ where: { code } });
        return account?.id || null;
    }

    /**
     * Creates a journal entry inside a STRICT financial transaction boundary.
     * Prevents partial commits and ensures double-entry accounting rules.
     */
    static async createEntry(tx: FinancialTxClient, params: CreateJournalEntryDTO) {
        try {
            // Validate: total debit must equal total credit
            const totalDebit = params.lines.reduce((sum, l) => sum + l.debit, 0);
            const totalCredit = params.lines.reduce((sum, l) => sum + l.credit, 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error(`القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}`);
            }

            // Resolve account IDs
            const resolvedLines: Array<any> = [];
            for (const line of params.lines) {
                if (line.debit === 0 && line.credit === 0 && (line.foreignDebit || 0) === 0 && (line.foreignCredit || 0) === 0) continue; // skip zero lines
                
                let accountId = line.accountId;
                if (!accountId && line.accountCode) {
                    accountId = await AccountingJournalService.getAccountId(line.accountCode, tx) || undefined;
                }
                
                if (!accountId) {
                    throw new Error(`حساب غير موجود للسطر: ${line.description || line.accountCode}`);
                }
                
                resolvedLines.push({
                    accountId,
                    costCenterId: line.costCenterId,
                    debit: line.debit,
                    credit: line.credit,
                    foreignDebit: line.foreignDebit || line.debit,
                    foreignCredit: line.foreignCredit || line.credit,
                    description: line.description,
                    // Universal Journal Dimensions
                    profitCenterId: line.profitCenterId,
                    projectId: line.projectId,
                    segmentId: line.segmentId,
                    productId: line.productId,
                    customerId: line.customerId,
                    vendorId: line.vendorId,
                    employeeId: line.employeeId,
                    assetId: line.assetId,
                    bookId: line.bookId,
                    fxRate: line.fxRate,
                    quantity: line.quantity,
                    uom: line.uom,
                });
            }

            const seqResult = await getNextNumber(tx, 'JE');
            const entryNumber = seqResult.formatted;
            const entryDate = params.date || new Date().toISOString().split('T')[0];

            // Ensure Fiscal Period is OPEN
            const [year, month] = entryDate.split('-').map(Number);
            if (year && month) {
                const period = await tx.fiscalPeriod.findUnique({
                    where: { year_month: { year, month } }
                });
                if (period && period.status !== 'open') {
                    throw new Error(`الفترة المالية (${month}/${year}) مغلقة أو مقفلة، لا يمكن إضافة قيود جديدة.`);
                }
            }

            const finalStatus = params.status || 'posted';
            
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber,
                    entryDate,
                    description: params.description,
                    reference: params.reference,
                    totalDebit: Math.round(totalDebit * 100) / 100,
                    totalCredit: Math.round(totalCredit * 100) / 100,
                    status: finalStatus,
                    createdBy: params.userId,
                    branchId: params.branchId,
                    // @ts-ignore - Local VSCode lock bypass
                    currencyId: params.currencyId || null,
                    exchangeRate: params.exchangeRate || 1.0,
                    lines: {
                        create: resolvedLines.map(l => ({
                            accountId: l.accountId,
                            costCenterId: l.costCenterId || null,
                            debit: Math.round(l.debit * 100) / 100,
                            credit: Math.round(l.credit * 100) / 100,
                            foreignDebit: Math.round(l.foreignDebit * 100) / 100,
                            foreignCredit: Math.round(l.foreignCredit * 100) / 100,
                            description: l.description,
                            // Universal Journal Dimensions (pass-through, all nullable)
                            profitCenterId: l.profitCenterId || null,
                            projectId: l.projectId || null,
                            segmentId: l.segmentId || null,
                            productId: l.productId || null,
                            customerId: l.customerId || null,
                            vendorId: l.vendorId || null,
                            employeeId: l.employeeId || null,
                            assetId: l.assetId || null,
                            bookId: l.bookId || null,
                            fxRate: l.fxRate || null,
                            quantity: l.quantity || null,
                            uom: l.uom || null,
                        })),
                    },
                },
            });

            // Update account balances INSIDE the same transaction ONLY IF POSTED
            if (finalStatus === 'posted') {
                for (const line of resolvedLines) {
                    const account = await tx.account.findUnique({ where: { id: line.accountId } });
                    if (account) {
                        let balanceChange = 0;
                        if (['asset', 'expense'].includes(account.type)) {
                            balanceChange = line.debit - line.credit;
                        } else {
                            balanceChange = line.credit - line.debit;
                        }
                        await tx.account.update({
                            where: { id: line.accountId },
                            data: { balance: { increment: Math.round(balanceChange * 100) / 100 } },
                        });
                    }
                }
            }

            return je;
        } catch (error: any) {
            log.error('AccountingJournalService error:', error);
            throw error; // Let the wrapper handle it
        }
    }
}
