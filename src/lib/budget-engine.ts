import { prisma } from './prisma';

export class BudgetEngine {
    
    /**
     * Creates or updates a budget line
     */
    static async createBudget(budgetId: number, accountId: number, costCenterId: number | null, allocatedAmount: number) {
        // Find existing line
        const existingLine = await prisma.budgetLine.findFirst({
            where: { budgetId, accountId, costCenterId }
        });

        if (existingLine) {
            return prisma.budgetLine.update({
                where: { id: existingLine.id },
                data: { allocatedAmount }
            });
        }

        return prisma.budgetLine.create({
            data: {
                budgetId,
                accountId,
                costCenterId,
                allocatedAmount,
                spentAmount: 0
            }
        });
    }

    /**
     * Checks if a new expense violates the approved budget.
     * Throws an error if strictBudgeting is enabled in Settings, else returns a warning flag.
     */
    static async checkBudget(accountId: number, costCenterId: number | null, newAmount: number, date: Date) {
        // 1. Find the active budget for this date
        const activeBudget = await prisma.budget.findFirst({
            where: {
                status: 'APPROVED',
                startDate: { lte: date },
                endDate: { gte: date }
            }
        });

        if (!activeBudget) {
            return { ok: true, message: 'No active approved budget found for this date.' };
        }

        // 2. Find the specific budget line
        const budgetLine = await prisma.budgetLine.findFirst({
            where: {
                budgetId: activeBudget.id,
                accountId,
                costCenterId
            }
        });

        if (!budgetLine) {
            return { ok: true, message: 'No budget constraint defined for this account/cost center.' };
        }

        // 3. Calculate actual expenses so far (from JournalLines)
        // Note: For large scale, you'd maintain a running balance or `spentAmount`
        const actualLines = await prisma.journalLine.aggregate({
            where: {
                accountId,
                costCenterId,
                entry: {
                    status: 'posted',
                    entryDate: {
                        gte: activeBudget.startDate.toISOString(),
                        lte: activeBudget.endDate.toISOString()
                    }
                }
            },
            _sum: { debit: true, credit: true }
        });

        // Expenses are typically debit balance
        const actualSpent = (actualLines._sum?.debit || 0) - (actualLines._sum?.credit || 0);
        const projectedTotal = actualSpent + newAmount;

        // 4. Check against Budget
        if (projectedTotal > budgetLine.allocatedAmount) {
            // Check strict budgeting setting
            const strictSetting = await prisma.setting.findUnique({ where: { key: 'strictBudgeting' } });
            const isStrict = strictSetting?.value === 'true';

            const variance = projectedTotal - budgetLine.allocatedAmount;

            if (isStrict) {
                throw new Error(`Budget Exceeded: Cannot process amount. Budget for Account ${accountId} is ${budgetLine.allocatedAmount}, but total would be ${projectedTotal}. Exceeds by ${variance}.`);
            } else {
                return { 
                    ok: true, 
                    warning: `Budget Warning: Expense exceeds budget by ${variance}. (Soft limit)` 
                };
            }
        }

        return { ok: true };
    }

    /**
     * Generates a Variance Report
     */
    static async getVarianceReport(budgetId: number) {
        const budgetLines = await prisma.budgetLine.findMany({
            where: { budgetId },
            include: { account: true, costCenter: true, budget: true }
        });

        const report = [];

        for (const line of budgetLines) {
            const actualLines = await prisma.journalLine.aggregate({
                where: {
                    accountId: line.accountId,
                    costCenterId: line.costCenterId,
                    entry: {
                        status: 'posted',
                        entryDate: {
                            gte: line.budget.startDate.toISOString(),
                            lte: line.budget.endDate.toISOString()
                        }
                    }
                },
                _sum: { debit: true, credit: true }
            });

            const actualSpent = (actualLines._sum?.debit || 0) - (actualLines._sum?.credit || 0);
            const variance = line.allocatedAmount - actualSpent;
            const variancePercentage = line.allocatedAmount > 0 ? (variance / line.allocatedAmount) * 100 : 0;

            report.push({
                accountId: line.accountId,
                accountName: line.account?.name || 'Unknown',
                costCenterId: line.costCenterId,
                costCenterName: line.costCenter?.name || 'No CC',
                allocated: line.allocatedAmount,
                actual: actualSpent,
                variance,
                variancePercentage: parseFloat(variancePercentage.toFixed(2))
            });
        }

        return report;
    }
}
