import { prisma } from './prisma';

export class ConsolidationEngine {
    static async runConsolidation(groupId: number, fiscalPeriodId: number, userId: string) {
        // Find group and subsidiaries
        // For phase 1, we simulate gathering the Trial Balances and applying eliminations
        
        const run = await prisma.consolidationRun.create({
            data: {
                groupId,
                fiscalPeriodId,
                status: 'DRAFT'
            }
        });

        // Simulating the aggregation of TBs:
        // 1. Gather TB for parent
        // 2. Gather TB for each subsidiary (mapped to parent chart of accounts)
        // 3. Apply Intercompany Eliminations

        const pendingIntercompany = await prisma.intercompanyTransaction.findMany({
            where: {
                status: 'PENDING'
            }
        });

        for (const ic of pendingIntercompany) {
            // Validate elimination
            await prisma.intercompanyTransaction.update({
                where: { id: ic.id },
                data: {
                    status: 'ELIMINATED',
                    reconciledAt: new Date()
                }
            });
        }

        return run;
    }

    static async postConsolidation(runId: number) {
        return prisma.consolidationRun.update({
            where: { id: runId },
            data: { status: 'POSTED' }
        });
    }
}
