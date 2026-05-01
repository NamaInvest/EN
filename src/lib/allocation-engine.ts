import { prisma } from './prisma';

export class AllocationEngine {
    static async runAllocation(ruleId: number, fiscalPeriodId: number) {
        const rule = await prisma.allocationRule.findUnique({
            where: { id: ruleId }
        });

        if (!rule) throw new Error("Allocation Rule not found");

        // Gather source cost center balance
        const sourceAmount = 1000; // Placeholder simulated amount

        // Calculate distribution based on rule.basis ('fixed_%', 'headcount', etc.)
        // Create Journal Entry
        /*
        const je = await prisma.journalEntry.create({
            data: {
                // DR Target Cost Centers
                // CR Source Cost Center
            }
        });
        */

        const run = await prisma.allocationRun.create({
            data: {
                ruleId,
                fiscalPeriodId,
                sourceAmount,
                status: 'COMPLETED'
            }
        });

        return run;
    }
}
