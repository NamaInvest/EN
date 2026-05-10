import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.allocation-e' });

export class AllocationEngine {
    
    /**
     * Executes all active allocation rules for a given period in priority order (Cascading)
     */
    static async runAllPeriodAllocations(fiscalPeriodId: number, userId: string) {
        const rules = await (prisma as any).allocationRule.findMany({
            take: 100,
            where: { isActive: true },
            orderBy: { priority: 'asc' }, // Cascading: Lower priority number runs first
        });

        const results = [];
        for (const rule of rules) {
            try {
                const run = await this.runAllocation(rule.id, fiscalPeriodId, userId);
                results.push({ ruleId: rule.id, status: 'SUCCESS', run });
            } catch (error: any) {
                results.push({ ruleId: rule.id, status: 'FAILED', error: error.message });
            }
        }
        return results;
    }

    /**
     * Preview an allocation without creating journal entries
     */
    static async simulateAllocation(ruleId: number, fiscalPeriodId: number) {
        return this._processAllocation(ruleId, fiscalPeriodId, true);
    }

    /**
     * Run a single allocation rule and commit to GL
     */
    static async runAllocation(ruleId: number, fiscalPeriodId: number, userId: string) {
        return this._processAllocation(ruleId, fiscalPeriodId, false, userId);
    }

    /**
     * Core processing logic
     */
    private static async _processAllocation(ruleId: number, fiscalPeriodId: number, simulate = false, userId?: string) {
        const rule = await (prisma as any).allocationRule.findUnique({
            where: { id: ruleId },
            include: { targets: true }
        });

        if (!rule) throw new Error("Allocation Rule not found");
        if (rule.targets.length === 0) throw new Error("Allocation Rule has no targets");

        // 1. Gather Source Amount
        // In a real system, we aggregate Journal Lines for the source Cost Center & Account in this period
        // For demonstration, we simulate fetching the balance
        let sourceAmount = 0;
        
        if (rule.sourceCostCenterId) {
            // Mock: Fetching balance
            // const lines = await (prisma as any).journalLine.aggregate({
            //     where: { costCenterId: rule.sourceCostCenterId, journalEntry: { fiscalPeriodId } },
            //     _sum: { debit: true, credit: true }
            // });
            // sourceAmount = (lines._sum.debit || 0) - (lines._sum.credit || 0);
            sourceAmount = 150000; // Mocked amount
        }

        if (sourceAmount <= 0) {
            return { message: "No source balance to allocate", sourceAmount: 0, lines: [] };
        }

        // 2. Calculate Weights based on Basis
        const distributions: { targetId: number, targetCcId: number, amount: number }[] = [];
        let totalWeight = 0;

        for (const target of rule.targets) {
            let weight = 0;
            switch (rule.basis) {
                case 'FIXED_PCT':
                    weight = target.percentage || 0;
                    break;
                case 'HEADCOUNT':
                case 'SQFT':
                case 'REVENUE':
                case 'CUSTOM':
                    weight = target.customWeight || 0;
                    break;
                default:
                    weight = 0;
            }
            totalWeight += weight;
        }

        if (totalWeight === 0) throw new Error("Total allocation weight is zero");

        // 3. Distribute Amount
        for (const target of rule.targets) {
            let weight = 0;
            if (rule.basis === 'FIXED_PCT') weight = target.percentage || 0;
            else weight = target.customWeight || 0;

            const allocatedAmount = (weight / totalWeight) * sourceAmount;
            distributions.push({
                targetId: target.id,
                targetCcId: target.targetCostCenterId,
                amount: allocatedAmount
            });
        }

        // 4. Return preview if simulate
        if (simulate) {
            return {
                ruleName: rule.name,
                sourceAmount,
                basis: rule.basis,
                distributions
            };
        }

        // 5. Create GL Entries & AllocationRun (if not simulate)
        return prisma.$transaction(async (tx) => {
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `ALLOC-${rule.id}-${Date.now()}`,
                    entryDate: new Date().toISOString(),
                    description: `Allocation Run for ${rule.name}`,
                    status: 'posted',
                    totalDebit: sourceAmount,
                    totalCredit: sourceAmount,
                    createdBy: userId ? parseInt(userId, 10) : undefined,
                    isReversal: false
                }
            });

            // Credit Source
            await (tx as any).journalLine.create({
                data: {
                    journalEntryId: je.id,
                    costCenterId: rule.sourceCostCenterId,
                    accountId: rule.sourceAccountId || 1, // Fallback
                    debit: 0,
                    credit: sourceAmount,
                    description: `Credit Source Cost Center - ${rule.name}`
                }
            });

            // Debit Targets
            for (const dist of distributions) {
                await (tx as any).journalLine.create({
                    data: {
                        journalEntryId: je.id,
                        costCenterId: dist.targetCcId,
                        accountId: rule.sourceAccountId || 1, // Same account, moved to diff CC
                        debit: dist.amount,
                        credit: 0,
                        description: `Allocated to Target CC - ${rule.name}`
                    }
                });
            }

            const run = await tx.allocationRun.create({
                data: {
                    ruleId,
                    fiscalPeriodId,
                    sourceAmount,
                    journalEntryId: je.id,
                    status: 'COMPLETED'
                }
            });

            return run;
        });
    }
}

