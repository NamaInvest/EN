import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.bank-reconci' });

export class BankReconciliationEngine {
    
    /**
     * Import a parsed bank statement
     */
    static async importStatement(bankAccountId: number, statementDate: Date, openingBalance: number, closingBalance: number, lines: any[]) {
        const statement = await prisma.bankStatement.create({
            data: {
                bankAccountId,
                openingDate: statementDate, closingDate: statementDate,
                openingBalance,
                closingBalance,
                fileFormat: 'CSV',
                importMethod: 'MANUAL',
                currency: 'SAR',
                lines: {
                    create: lines.map(l => ({
                        transactionDate: l.date,
                        description: l.description,
                        reference: l.reference,
                        amount: l.amount,
                        type: l.amount >= 0 ? 'CREDIT' : 'DEBIT'
                    }))
                }
            },
            include: { lines: true }
        });
        
        return statement;
    }

    /**
     * Auto-match bank statement lines with open items or system payments
     */
    static async autoMatch(statementId: number) {
        const statement = await prisma.bankStatement.findUnique({
            where: { id: statementId },
            include: { lines: true }
        });

        if (!statement) throw new Error("Statement not found");

        let matchesFound = 0;

        for (const line of statement.lines) {
            if (line.matchStatus !== 'UNMATCHED') continue;

            // Search for matching OpenItem (payment or receipt) by exact amount and within +/- 3 days
            const targetDate = new Date(line.transactionDate);
            const dateFrom = new Date(targetDate);
            dateFrom.setDate(dateFrom.getDate() - 3);
            const dateTo = new Date(targetDate);
            dateTo.setDate(dateTo.getDate() + 3);

            const match = await prisma.openItem.findFirst({
                where: {
                    documentType: 'payment',
                    amount: Math.abs(Number(line.amount)), // Match exact amount
                    dueDate: { gte: dateFrom, lte: dateTo }
                }
            });

            if (match) {
                // We found a likely match
                await prisma.bankStatementLine.update({
                    where: { id: line.id },
                    data: {
                        matchStatus: 'AUTO_MATCHED',
                        matchedToId: match.id
                    }
                });
                matchesFound++;
            }
        }

        // If all lines are matched, mark statement as RECONCILED
        const remaining = await prisma.bankStatementLine.count({
            where: { statementId, matchStatus: 'UNMATCHED' }
        });

        if (remaining === 0) {
            await prisma.bankStatement.update({
                where: { id: statementId },
                data: { reconStatus: 'COMPLETED' }
            });
        }

        return matchesFound;
    }
}
