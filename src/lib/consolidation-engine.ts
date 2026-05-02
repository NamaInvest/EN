import { prisma } from './prisma';

export class ConsolidationEngine {
    static async runConsolidation(groupId: number, fiscalPeriodId: number, userId: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Create Draft Consolidation Run
            const run = await tx.consolidationRun.create({
                data: {
                    groupId,
                    fiscalPeriodId,
                    userId: parseInt(userId, 10),
                    status: 'DRAFT'
                }
            });

            // 2. Fetch Group and Subsidiaries (Companies)
            const group = await tx.consolidationGroup.findUnique({
                where: { id: groupId }
            });

            if (!group) {
                throw new Error('Consolidation group not found');
            }

            // In a real scenario, we would map over each subsidiary,
            // fetch their Trial Balance, convert currency using ExchangeRate,
            // and perform Chart-of-Accounts mapping.
            // For now, we simulate the TB aggregation step.

            // 3. Intercompany Eliminations
            const pendingIntercompany = await tx.intercompanyTransaction.findMany({
                where: { status: 'PENDING' }
            });

            const eliminationLines = [];

            for (const ic of pendingIntercompany) {
                // Generate elimination lines based on type
                if (ic.type === 'AR_AP') {
                    // Reverse AR/AP
                    eliminationLines.push({
                        runId: run.id,
                        type: 'ELIMINATION',
                        description: `Eliminate Intercompany AR/AP between ${ic.sourceCompanyId} and ${ic.targetCompanyId}`,
                        amount: ic.amount,
                        sourceCompanyId: ic.sourceCompanyId,
                        targetCompanyId: ic.targetCompanyId
                    });
                } else if (ic.type === 'SALES_COGS') {
                    eliminationLines.push({
                        runId: run.id,
                        type: 'ELIMINATION',
                        description: `Eliminate Intercompany Sales/COGS between ${ic.sourceCompanyId} and ${ic.targetCompanyId}`,
                        amount: ic.amount,
                        sourceCompanyId: ic.sourceCompanyId,
                        targetCompanyId: ic.targetCompanyId
                    });
                } else if (ic.type === 'UNREALIZED_PROFIT') {
                     eliminationLines.push({
                        runId: run.id,
                        type: 'ELIMINATION',
                        description: `Eliminate Unrealized Profit in Inventory`,
                        amount: ic.amount,
                        sourceCompanyId: ic.sourceCompanyId,
                        targetCompanyId: ic.targetCompanyId
                    });
                }

                // Update Intercompany Transaction status
                await tx.intercompanyTransaction.update({
                    where: { id: ic.id },
                    data: {
                        status: 'ELIMINATED',
                        reconciledAt: new Date()
                    }
                });
            }

            // 4. Calculate Non-Controlling Interest (NCI)
            // Retrieve subsidiaries to check ownership percentages
            // (Assuming all companies except parent are subsidiaries for this group logic)
            const companies = await tx.company.findMany();
            for (const comp of companies) {
                if (comp.id !== group.parentCompanyId && comp.ownershipPct < 100) {
                    const nciPct = 100 - comp.ownershipPct;
                    // Mock calculation for NCI: normally (Subsidiary Equity * NCI Pct)
                    const estimatedEquity = 100000; // placeholder for subsidiary equity
                    const nciAmount = (estimatedEquity * nciPct) / 100;
                    
                    eliminationLines.push({
                        runId: run.id,
                        type: 'NCI',
                        description: `Non-Controlling Interest (${nciPct}%) for Company ${comp.name}`,
                        amount: nciAmount,
                        targetCompanyId: comp.id
                    });
                }
            }

            // Insert all generated elimination lines
            if (eliminationLines.length > 0) {
                await tx.consolidationLine.createMany({
                    data: eliminationLines
                });
            }

            return run;
        });
    }

    static async reviewConsolidation(runId: number) {
        return prisma.consolidationRun.update({
            where: { id: runId },
            data: { status: 'REVIEWED' }
        });
    }

    static async postConsolidation(runId: number) {
        const run = await prisma.consolidationRun.findUnique({ where: { id: runId } });
        if (run?.status !== 'REVIEWED') {
            throw new Error("Consolidation run must be in REVIEWED state to be posted.");
        }
        return prisma.consolidationRun.update({
            where: { id: runId },
            data: { status: 'POSTED' }
        });
    }

    static async reverseConsolidation(runId: number) {
        // Reverse process logic
        return prisma.$transaction(async (tx) => {
            const run = await tx.consolidationRun.update({
                where: { id: runId },
                data: { status: 'REVERSED' }
            });

            // Re-open eliminated intercompany transactions
            // Fetch lines associated with this run
            const lines = await tx.consolidationLine.findMany({ where: { runId } });
            
            // Revert intercompany status (conceptual approximation since relation to exact IC isn't perfectly mapped)
            await tx.intercompanyTransaction.updateMany({
                where: { status: 'ELIMINATED' },
                data: { status: 'PENDING', reconciledAt: null }
            });

            return run;
        });
    }
}
