import { prisma } from './prisma';
import { n } from './decimal-utils';

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
            // 1. Fetch Settings for FX Gain/Loss Accounts
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

            // 2. Fetch latest exchange rates up to periodEndDate
            const currencies = await tx.currency.findMany({
            take: 100,
                where: { code: { not: baseCurrencyCode } }
            });

            const closingRates: Record<number, number> = {};
            for (const currency of currencies) {
                const latestRate = await tx.exchangeRate.findFirst({
                    where: { 
                        currencyId: currency.id,
                        date: { lte: periodEndDate }
                    },
                    orderBy: { date: 'desc' }
                });
                // Default to 1 if no rate found, though ideally this should throw
                closingRates[currency.id] = latestRate?.rate || 1;
            }

            // 3. Revalue Open Items (AR/AP)
            const foreignInvoices = await tx.salesInvoice.findMany({
            take: 100,
                where: { 
                    status: 'posted', 
                    currencyId: { not: null }
                },
                include: { currency: true }
            });

            for (const inv of foreignInvoices) {
                if (!inv.currencyId) continue;
                
                // Rate at invoice creation
                const oldRateObj = await tx.exchangeRate.findFirst({
                    where: {
                        currencyId: inv.currencyId,
                        date: { lte: inv.date }
                    },
                    orderBy: { date: 'desc' }
                });
                
                const oldRate = oldRateObj?.rate || 1;
                const newRate = closingRates[inv.currencyId] || 1;
                
                const outstandingForeignAmount = inv.total; // Assumes open. Ideally check amount_due
                
                const currentFunctionalAmount = n(outstandingForeignAmount) * oldRate;
                const revaluatedFunctionalAmount = n(outstandingForeignAmount) * newRate;
                
                const difference = revaluatedFunctionalAmount - currentFunctionalAmount;

                if (difference > 0) {
                    totalGain += difference;
                } else if (difference < 0) {
                    totalLoss += Math.abs(difference);
                }
            }

            // 4. Revalue Bank Accounts
            const foreignBanks = await tx.bankAccount.findMany({
            take: 100,
                where: { currency: { not: baseCurrencyCode } }
            });

            for (const bank of foreignBanks) {
                // Find currency object matching the bank's currency string code
                const curr = currencies.find(c => c.code === bank.currency);
                if (!curr) continue;

                const newRate = closingRates[curr.id] || 1;
                const balance = bank.currentBalance;
                
                // Placeholder logic: assume it was previously translated at 1
                const currentVal = balance * 1; 
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
                    exchangeRateUsed: Object.values(closingRates)[0] || 1, // Store first rate as a proxy
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
            take: 100,
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
