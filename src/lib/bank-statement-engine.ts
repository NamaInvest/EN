import { prisma } from './prisma';
import crypto from 'crypto';

export class BankStatementEngine {
    
    /**
     * Entry point for manual upload
     */
    static async processUpload(bankAccountId: number, fileName: string, fileContent: string, formatHint?: string, userId?: string) {
        // 1. Parse File
        let parsedStatement: any;
        
        if (formatHint === 'MT940') {
            parsedStatement = this.parseMT940(fileContent, fileName);
        } else if (formatHint === 'CSV' || fileName.endsWith('.csv')) {
            parsedStatement = this.parseCSV(fileContent, fileName);
        } else if (formatHint === 'CAMT053' || fileName.endsWith('.xml')) {
            parsedStatement = this.parseCamt053(fileContent, fileName);
        } else {
            // Auto detect
            if (fileContent.includes(':20:') && fileContent.includes(':61:')) {
                parsedStatement = this.parseMT940(fileContent, fileName);
            } else {
                parsedStatement = this.parseCSV(fileContent, fileName); // Default fallback
            }
        }

        // 2. Validate Balance
        let validationStatus = 'VALID';
        let validationDifference = 0;

        let calculatedNet = 0;
        for (const txn of parsedStatement.transactions) {
            calculatedNet += (txn.type === 'CREDIT' ? txn.amount : -txn.amount);
        }
        
        const expectedClosing = parsedStatement.openingBalance + calculatedNet;
        
        // Precision issue fix
        if (Math.abs(expectedClosing - parsedStatement.closingBalance) > 0.01) {
            validationStatus = 'BALANCE_MISMATCH';
            validationDifference = expectedClosing - parsedStatement.closingBalance;
        }

        const bankAccount = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!bankAccount) throw new Error("Bank Account not found");

        let importedTxns = 0;
        let duplicatesSkipped = 0;

        // 3. Begin Transaction
        const result = await prisma.$transaction(async (tx) => {
            const statement = await tx.bankStatement.create({
                data: {
                    bankAccountId,
                    fileFormat: parsedStatement.fileFormat,
                    fileName,
                    importedByUserId: userId || 'SYSTEM',
                    importMethod: 'MANUAL',
                    currency: parsedStatement.currency || 'SAR',
                    openingBalance: parsedStatement.openingBalance,
                    openingDate: parsedStatement.openingDate,
                    closingBalance: parsedStatement.closingBalance,
                    closingDate: parsedStatement.closingDate,
                    validationStatus,
                    validationDifference: validationDifference !== 0 ? validationDifference : null,
                    totalTransactions: parsedStatement.transactions.length
                }
            });

            const lineDataToInsert = [];

            // 4. Duplicate Check & Prepare Insert
            for (const txn of parsedStatement.transactions) {
                // hash = SHA256(date + amount + reference + counterparty)
                const hashInput = `${txn.transactionDate.toISOString()}_${txn.amount}_${txn.reference || ''}_${txn.counterpartyName || ''}`;
                const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

                const existing = await tx.bankStatementLine.findFirst({
                    where: { hash }
                });

                if (existing) {
                    duplicatesSkipped++;
                    continue;
                }

                lineDataToInsert.push({
                    statementId: statement.id,
                    transactionDate: txn.transactionDate,
                    valueDate: txn.valueDate || txn.transactionDate,
                    amount: txn.amount,
                    currency: txn.currency || 'SAR',
                    type: txn.type,
                    description: txn.description,
                    reference: txn.reference,
                    counterpartyName: txn.counterpartyName,
                    hash,
                    matchStatus: 'UNMATCHED'
                });
            }

            if (lineDataToInsert.length > 0) {
                await tx.bankStatementLine.createMany({
                    data: lineDataToInsert
                });
            }
            
            importedTxns = lineDataToInsert.length;

            await tx.bankStatement.update({
                where: { id: statement.id },
                data: { duplicatesCount: duplicatesSkipped }
            });

            return statement;
        });

        // Optional: Trigger Reconciliation Engine here
        // ReconciliationEngine.matchStatement(result.id);

        return {
            statementId: result.id,
            validationStatus,
            validationDifference,
            txnsImported: importedTxns,
            duplicatesSkipped
        };
    }

    /**
     * MOCK: Parse MT940
     */
    private static parseMT940(fileContent: string, fileName: string) {
        // Mock Implementation for brevity
        return {
            fileFormat: 'MT940',
            currency: 'SAR',
            openingBalance: 10000,
            openingDate: new Date(),
            closingBalance: 10500,
            closingDate: new Date(),
            transactions: [
                {
                    transactionDate: new Date(),
                    amount: 500,
                    currency: 'SAR',
                    type: 'CREDIT',
                    description: 'Mock MT940 Deposit',
                    reference: 'REF-123',
                    counterpartyName: 'Ahmad'
                }
            ]
        };
    }

    /**
     * MOCK: Parse CSV
     */
    private static parseCSV(fileContent: string, fileName: string) {
        // Date,Description,Debit,Credit,Balance
        const lines = fileContent.split('\n');
        const transactions = [];
        let openingBalance = 0;
        let closingBalance = 0;
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(',');
            if (cols.length >= 4) {
                const debit = parseFloat(cols[2]) || 0;
                const credit = parseFloat(cols[3]) || 0;
                const balance = parseFloat(cols[4]) || 0;
                
                if (i === 1) openingBalance = balance - credit + debit;
                closingBalance = balance;

                transactions.push({
                    transactionDate: new Date(cols[0] || new Date()),
                    amount: debit > 0 ? debit : credit,
                    type: debit > 0 ? 'DEBIT' : 'CREDIT',
                    description: cols[1],
                    currency: 'SAR'
                });
            }
        }

        return {
            fileFormat: 'CSV',
            currency: 'SAR',
            openingBalance,
            openingDate: new Date(),
            closingBalance,
            closingDate: new Date(),
            transactions
        };
    }

    /**
     * MOCK: Parse CAMT.053
     */
    private static parseCamt053(fileContent: string, fileName: string) {
        return {
            fileFormat: 'CAMT053',
            currency: 'SAR',
            openingBalance: 20000,
            openingDate: new Date(),
            closingBalance: 19000,
            closingDate: new Date(),
            transactions: [
                {
                    transactionDate: new Date(),
                    amount: 1000,
                    currency: 'SAR',
                    type: 'DEBIT',
                    description: 'Mock CAMT053 Withdrawal',
                    reference: 'CAMT-999',
                    counterpartyName: 'Supplier X'
                }
            ]
        };
    }
}
