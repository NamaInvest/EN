import { PrismaClient } from '@prisma/client';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'budget-control' });

export class BudgetControlEngine {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Checks if there is enough budget available for a given account/cost center in the current year.
     * Available = Allocated - Spent - Encumbered
     */
    async checkBudgetAvailability(accountId: number, costCenterId: number | null, amount: number, date: Date = new Date()) {
        const year = date.getFullYear();

        // 1. Find active budget for this year
        const budget = await this.prisma.budget.findFirst({
            where: { fiscalYear: year, status: 'APPROVED' },
            include: { lines: { where: { accountId, costCenterId } } }
        });

        if (!budget || budget.lines.length === 0) {
            return { allowed: true, available: Infinity, breachPct: 0, message: 'لا توجد موازنة معتمدة لهذا البند.' };
        }

        const line = budget.lines[0];
        const allocated = line.allocatedAmount;

        // 2. Find spent amount from JournalEntries (or we can rely on spentAmount if it's updated correctly)
        // We'll rely on spentAmount assuming Period-Close or auto-journal updates it.
        const spent = line.spentAmount || 0;

        // 3. Find active encumbrances (committed but not yet spent)
        const activeEncumbrances = await (this.prisma as any).encumbrance.aggregate({
            _sum: { amount: true },
            where: {
                accountId,
                costCenterId,
                status: 'ACTIVE',
                createdAt: {
                    gte: budget.startDate,
                    lte: budget.endDate
                }
            }
        });

        const encumbered = n(activeEncumbrances._sum.amount);
        const available = n(allocated) - n(spent) - encumbered;
        const proposedTotal = n(spent) + encumbered + amount;
        const breachPct = n(allocated) > 0 ? (proposedTotal / n(allocated)) * 100 : 100;

        return {
            allowed: available >= amount,
            allocated,
            spent,
            encumbered,
            available,
            breachPct,
            message: available >= amount ? 'الموازنة كافية' : 'تجاوز في الموازنة المعتمدة'
        };
    }

    /**
     * Creates an encumbrance (e.g., when a PO is approved)
     */
    async createEncumbrance(docType: string, docId: number, accountId: number, costCenterId: number | null, amount: number) {
        const enc = await (this.prisma as any).encumbrance.create({
            data: {
                sourceDocType: docType,
                sourceDocId: docId,
                accountId,
                costCenterId,
                amount,
                status: 'ACTIVE'
            }
        });
        return enc;
    }

    /**
     * Releases an encumbrance (e.g., when PO turns into Invoice and is actualized)
     */
    async releaseEncumbrance(docType: string, docId: number) {
        const encumbrances = await (this.prisma as any).encumbrance.updateMany({
            where: {
                sourceDocType: docType,
                sourceDocId: docId,
                status: 'ACTIVE'
            },
            data: {
                status: 'RELEASED',
                releasedAt: new Date()
            }
        });
        return encumbrances;
    }

    /**
     * Computes variance analysis for a specific budget
     */
    async getVarianceAnalysis(budgetId: number) {
        const budget = await this.prisma.budget.findUnique({
            where: { id: budgetId },
            include: {
                lines: {
                    include: {
                        account: { select: { name: true, code: true } },
                        costCenter: { select: { name: true } }
                    }
                }
            }
        });

        if (!budget) throw new Error('Budget not found');

        const variances = [];
        for (const line of budget.lines) {
            const activeEncumbrances = await (this.prisma as any).encumbrance.aggregate({
                _sum: { amount: true },
                where: {
                    accountId: line.accountId,
                    costCenterId: line.costCenterId,
                    status: 'ACTIVE',
                    createdAt: {
                        gte: budget.startDate,
                        lte: budget.endDate
                    }
                }
            });

            const encumbered = n(activeEncumbrances._sum.amount);
            const variance = n(line.allocatedAmount) - n(line.spentAmount) - encumbered;

            variances.push({
                accountId: line.accountId,
                accountName: line.account.name,
                costCenterName: line.costCenter?.name || 'عام',
                allocated: line.allocatedAmount,
                spent: line.spentAmount,
                encumbered,
                variance,
                status: variance >= 0 ? 'FAVORABLE' : 'UNFAVORABLE'
            });
        }

        return {
            budgetId: budget.id,
            name: budget.name,
            totalAllocated: budget.totalAmount,
            variances
        };
    }
}
