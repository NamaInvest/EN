import { prisma } from './prisma';

export class FxRevaluationEngine {
    /**
     * Run Multi-Currency FX Revaluation at period end
     */
    static async runRevaluation(
        fiscalPeriodId: number, 
        baseCurrencyCode: string,
        periodEndDate: Date,
        userId: string
    ) {
        return prisma.$transaction(async (tx) => {
            // 1. Fetch current exchange rates for periodEndDate
            // In a real scenario, this would come from an ExchangeRate table for the specific date.
            // We'll simulate fetching rates for open foreign currency items.
            
            // 2. Fetch Settings for FX Gain/Loss Accounts
            const gainSetting = await tx.setting.findUnique({ where: { key: 'fxRevaluationGainAccount' } });
            const lossSetting = await tx.setting.findUnique({ where: { key: 'fxRevaluationLossAccount' } });

            const fxGainAccountId = gainSetting?.value ? parseInt(gainSetting.value) : null;
            const fxLossAccountId = lossSetting?.value ? parseInt(lossSetting.value) : null;

            if (!fxGainAccountId || !fxLossAccountId) {
                throw new Error("FX Revaluation Accounts are not configured in Settings.");
            }

            let totalGain = 0;
            let totalLoss = 0;
            const journalLines: any[] = [];

            // 3. Revalue Open Items (AR/AP)
            // Simulating fetching foreign AR/AP open invoices
            const foreignInvoices = await tx.salesInvoice.findMany({
                where: { 
                    status: 'posted', 
                    // Assume we check currency logic here or balance remaining
                }
            });

            for (const inv of foreignInvoices) {
                // Mocking: OldRate vs NewRate
                const oldRate = 3.75; // Rate at invoice date
                const newRate = 3.78; // Rate at periodEndDate
                const outstandingForeignAmount = inv.grandTotal; // Assuming fully open
                
                const currentFunctionalAmount = outstandingForeignAmount * oldRate;
                const revaluatedFunctionalAmount = outstandingForeignAmount * newRate;
                
                const difference = revaluatedFunctionalAmount - currentFunctionalAmount;

                // If AR: difference > 0 means Gain (Asset increased value in functional currency)
                if (difference > 0) {
                    totalGain += difference;
                    // Debit AR, Credit FX Gain
                    // We'd add to journalLines
                } else if (difference < 0) {
                    totalLoss += Math.abs(difference);
                    // Credit AR, Debit FX Loss
                }
            }

            // 4. Revalue Bank Accounts
            const foreignBanks = await tx.bankAccount.findMany({
                where: { currency: { not: baseCurrencyCode } }
            });

            for (const bank of foreignBanks) {
                const oldRate = 3.75; // average or historical rate
                const newRate = 3.78;
                const balance = bank.currentBalance;

                const currentVal = balance * oldRate;
                const newVal = balance * newRate;
                const diff = newVal - currentVal;

                if (diff > 0) {
                    totalGain += diff;
                } else if (diff < 0) {
                    totalLoss += Math.abs(diff);
                }
            }

            // 5. Create the FxRevaluationRun Record
            const runRecord = await tx.fxRevaluationRun.create({
                data: {
                    fiscalPeriodId,
                    runDate: periodEndDate,
                    exchangeRateUsed: 3.78, // Simplified
                    totalGain,
                    totalLoss,
                    status: 'DRAFT',
                    createdBy: userId
                }
            });

            return runRecord;
        });
    }

    /**
     * Post the FX Revaluation to General Ledger
     */
    static async postRevaluation(runId: number) {
        return prisma.$transaction(async (tx) => {
            const run = await tx.fxRevaluationRun.findUnique({ where: { id: runId } });
            if (!run || run.status === 'POSTED') throw new Error("Invalid or already posted run");

            // Define first day of next period for auto-reversal
            const autoReverseDate = new Date(run.runDate);
            autoReverseDate.setDate(autoReverseDate.getDate() + 1);

            // Generate Journal Entry
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `FX-REV-${run.id}`,
                    entryDate: run.runDate.toISOString(),
                    description: `Period End FX Revaluation - Period ${run.fiscalPeriodId}`,
                    status: 'posted',
                    totalDebit: Number(run.totalGain) + Number(run.totalLoss),
                    totalCredit: Number(run.totalGain) + Number(run.totalLoss),
                    autoReverseDate: autoReverseDate, // Auto-reversal flagged
                    isReversal: false
                }
            });

            await tx.fxRevaluationRun.update({
                where: { id: runId },
                data: { 
                    status: 'POSTED',
                    journalEntryId: je.id 
                } 
            });

            return je;
        });
    }

    /**
     * Auto Reverse previous period's FX entries
     */
    static async processAutoReversals(currentDate: Date) {
        const entriesToReverse = await prisma.journalEntry.findMany({
            where: {
                autoReverseDate: { lte: currentDate },
                isReversal: false
            },
            include: { lines: true }
        });

        for (const entry of entriesToReverse) {
            await prisma.journalEntry.create({
                data: {
                    entryNumber: `REV-${entry.entryNumber}`,
                    entryDate: currentDate.toISOString(),
                    description: `Auto-reversal of ${entry.entryNumber}`,
                    status: 'posted',
                    totalDebit: entry.totalCredit,
                    totalCredit: entry.totalDebit,
                    isReversal: true,
                    reference: entry.entryNumber,
                    lines: {
                        create: entry.lines.map(line => ({
                            accountId: line.accountId,
                            costCenterId: line.costCenterId,
                            debit: line.credit, // swap debit and credit
                            credit: line.debit,
                            description: `Auto-reversal line for ${entry.entryNumber}`
                        }))
                    }
                }
            });

            // Mark the original entry as reversed so we don't reverse it again
            await prisma.journalEntry.update({
                where: { id: entry.id },
                data: { autoReverseDate: null } 
            });
        }
    }
}
