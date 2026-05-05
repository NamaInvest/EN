import { prisma } from './prisma';

export class MultiBookEngine {

    /**
     * Post a Journal Entry across multiple Accounting Books
     */
    static async postMultiBookJournal(baseEntryData: any, linesData: any[], userId: string) {
        // Find all active Accounting Books
        const books = await prisma.accountingBook.findMany();

        if (books.length === 0) {
            throw new Error("No Accounting Books defined in the system.");
        }

        const entriesCreated: any[] = [];

        return prisma.$transaction(async (tx) => {
            for (const book of books) {
                // Determine if we need to map accounts for this book
                const mappedLines = [];

                for (const line of linesData) {
                    let targetAccountId = line.accountId;

                    if (!book.isPrimary) {
                        // Look for an account mapping rule from Primary to this Book
                        const mapping = await tx.accountMapping.findFirst({
                            where: {
                                bookId: book.id,
                                sourceAccountId: line.accountId
                            }
                        });

                        if (mapping) {
                            targetAccountId = mapping.targetAccountId;
                        }
                    }

                    mappedLines.push({
                        accountId: targetAccountId,
                        costCenterId: line.costCenterId,
                        debit: line.debit,
                        credit: line.credit,
                        description: line.description
                    });
                }

                // Create the Journal Entry for this specific Book
                const je = await tx.journalEntry.create({
                    data: {
                        entryNumber: `${baseEntryData.entryNumber}-${book.code}`,
                        entryDate: baseEntryData.entryDate,
                        description: `[${book.code}] ${baseEntryData.description}`,
                        status: 'posted',
                        totalDebit: baseEntryData.totalDebit,
                        totalCredit: baseEntryData.totalCredit,
                        createdBy: parseInt(userId, 10),
                        bookId: book.id,
                        lines: {
                            create: mappedLines
                        }
                    },
                    include: { lines: true }
                });

                entriesCreated.push(je);
            }

            return entriesCreated;
        });
    }

    /**
     * Get Reconciliation Report (Compare Trial Balance between two books)
     */
    static async getBookReconciliation(sourceBookId: number, targetBookId: number, fiscalPeriodId: number) {
        // In a real-world scenario, this aggregates all journal lines for both books
        // and highlights the delta per account.
        
        // Mock Implementation for structure
        const sourceBook = await prisma.accountingBook.findUnique({ where: { id: sourceBookId } });
        const targetBook = await prisma.accountingBook.findUnique({ where: { id: targetBookId } });

        if (!sourceBook || !targetBook) throw new Error("Books not found");

        // Here we would run raw SQL to aggregate sum(debit) - sum(credit) grouped by account
        // for both books, and join them.
        
        return {
            sourceBook: sourceBook.code,
            targetBook: targetBook.code,
            period: fiscalPeriodId,
            differences: [
                {
                    accountName: "Depreciation Expense",
                    sourceBalance: 15000, // e.g., IFRS straight-line
                    targetBalance: 25000, // e.g., Tax accelerated
                    variance: -10000,
                    reason: "Different depreciation methods"
                },
                {
                    accountName: "Revenue",
                    sourceBalance: 100000, // e.g., IFRS 15 POC
                    targetBalance: 80000, // e.g., Tax cash basis
                    variance: 20000,
                    reason: "Revenue recognition timing"
                }
            ]
        };
    }
}
