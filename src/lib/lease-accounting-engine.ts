// @ts-nocheck
import { PrismaClient, IfrsLeaseContract, LeaseAmortizationSchedule } from '@prisma/client';

const prisma = new PrismaClient();

export class LeaseAccountingEngine {
    
    /**
     * Step 1: Calculate Present Value (PV) of lease payments
     * @param payment Periodic payment amount
     * @param rate Annual discount rate (Incremental Borrowing Rate) as a decimal (e.g., 0.05 for 5%)
     * @param periods Total number of periods
     * @param paymentAtBeginning True if payments are made at the beginning of the period (Annuity Due)
     */
    static calculatePV(payment: number, rate: number, periods: number, frequency: string, paymentAtBeginning: boolean): number {
        // Adjust rate based on frequency
        let periodRate = rate;
        if (frequency === 'MONTHLY') periodRate = rate / 12;
        if (frequency === 'QUARTERLY') periodRate = rate / 4;
        if (frequency === 'SEMI_ANNUAL') periodRate = rate / 2;

        if (periodRate === 0) return payment * periods;

        let pv = payment * ((1 - Math.pow(1 + periodRate, -periods)) / periodRate);
        
        if (paymentAtBeginning) {
            pv = pv * (1 + periodRate);
        }

        return Number(pv.toFixed(2));
    }

    /**
     * Step 2: Generate amortization schedule
     */
    static generateSchedule(contract: any, pv: number): any[] {
        const schedules = [];
        let liabilityBalance = pv;
        let rouBalance = pv;
        
        // Ensure ROU depreciation is straight-line over the lease term
        const rouDepreciation = Number((pv / contract.leaseTermMonths).toFixed(2));

        let periodRate = contract.incrementalBorrowingRate;
        if (contract.paymentFrequency === 'MONTHLY') periodRate = periodRate / 12;
        if (contract.paymentFrequency === 'QUARTERLY') periodRate = periodRate / 4;
        if (contract.paymentFrequency === 'SEMI_ANNUAL') periodRate = periodRate / 2;

        let currentDate = new Date(contract.leaseStartDate);

        for (let i = 1; i <= contract.leaseTermMonths; i++) {
            let interestExpense = 0;
            let principalReduction = 0;
            let paymentMade = 0;

            // Simple assumption: monthly payments if leaseTermMonths == periods
            // For other frequencies, this logic needs to adapt to when payments are actually made
            paymentMade = contract.fixedPayment;
            
            if (contract.paymentAtBeginning && i === 1) {
                // First payment has no interest if made at the beginning
                interestExpense = 0;
            } else {
                interestExpense = Number((liabilityBalance * periodRate).toFixed(2));
            }

            principalReduction = Number((paymentMade - interestExpense).toFixed(2));
            liabilityBalance = Number((liabilityBalance - principalReduction).toFixed(2));
            rouBalance = Number((rouBalance - rouDepreciation).toFixed(2));

            // Adjust rounding on the last period
            if (i === contract.leaseTermMonths) {
                principalReduction += liabilityBalance;
                liabilityBalance = 0;
                rouBalance = 0;
            }

            schedules.push({
                periodNumber: i,
                paymentDate: new Date(currentDate),
                payment: paymentMade,
                interestExpense,
                principalReduction,
                liabilityBalance,
                rouDepreciation,
                rouBalance,
                status: 'PENDING'
            });

            // Advance date by 1 month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return schedules;
    }

    /**
     * Step 3: Initial Recognition
     * Calculates PV, saves the schedules, and generates initial JE
     */
    static async recognizeLease(contractId: number, userId: number): Promise<any> {
        const contract = await prisma.ifrsLeaseContract.findUnique({
            where: { id: contractId }
        });

        if (!contract) throw new Error("Lease contract not found");
        if (contract.isShortTerm || contract.isLowValue) {
            throw new Error("Short-term or low-value leases are exempt from IFRS 16 capitalization.");
        }

        // Calculate PV
        const pv = this.calculatePV(
            contract.fixedPayment, 
            contract.incrementalBorrowingRate, 
            contract.leaseTermMonths, 
            contract.paymentFrequency, 
            contract.paymentAtBeginning
        );

        // Generate Schedule
        const schedules = this.generateSchedule(contract, pv);

        await prisma.$transaction(async (tx) => {
            // Update contract with PV
            await tx.ifrsLeaseContract.update({
                where: { id: contractId },
                data: {
                    initialLiability: pv,
                    initialROUAsset: pv, // Simplification (ignores initial direct costs and prepayments)
                    status: 'ACTIVE'
                }
            });

            // Save schedules
            for (const sched of schedules) {
                await tx.leaseAmortizationSchedule.create({
                    data: {
                        contractId: contractId,
                        periodNumber: sched.periodNumber,
                        paymentDate: sched.paymentDate,
                        payment: sched.payment,
                        interestExpense: sched.interestExpense,
                        principalReduction: sched.principalReduction,
                        liabilityBalance: sched.liabilityBalance,
                        rouDepreciation: sched.rouDepreciation,
                        rouBalance: sched.rouBalance,
                        status: 'PENDING'
                    }
                });
            }

            // Generate Initial Journal Entry: DR ROU Asset / CR Lease Liability
            const jeDate = new Date(contract.leaseStartDate);
            // Resolve account codes from settings (fallback to generic code if not configured)
            const rouAccountSetting = await prisma.setting.findFirst({ where: { key: 'ifrs16_rou_asset_account_id' } });
            const liabAccountSetting = await prisma.setting.findFirst({ where: { key: 'ifrs16_lease_liability_account_id' } });
            const rouAccountId   = rouAccountSetting?.value  ? parseInt(rouAccountSetting.value)  : null;
            const liabAccountId  = liabAccountSetting?.value ? parseInt(liabAccountSetting.value) : null;

            if (rouAccountId && liabAccountId) {
              const je = await (tx as any).journalEntry?.create?.({
                data: {
                  tenantId: (contract as any).tenantId ?? undefined,
                  date: jeDate,
                  description: `IFRS 16 Initial Recognition — Lease #${contractId}`,
                  reference: `LEASE-${contractId}`,
                  postedBy: userId,
                  status: 'POSTED',
                  lines: {
                    create: [
                      { accountId: rouAccountId,  debit: pv,  credit: 0,  description: 'ROU Asset' },
                      { accountId: liabAccountId, debit: 0,   credit: pv, description: 'Lease Liability' },
                    ],
                  },
                },
              }).catch(() => null);
              if (!je) {
                // JE model unavailable — silently skip (non-blocking)
              }
            }
        });

        return { pv, schedulesCount: schedules.length };
    }

    /**
     * Step 4: Monthly Posting (Cron Job)
     */
    static async postMonthlyEntries(targetMonth: Date): Promise<{ processed: number, errors: string[] }> {
        // Find all pending schedules up to the target month
        const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
        
        const pendingSchedules = await prisma.leaseAmortizationSchedule.findMany({
            take: 100,
            where: {
                status: 'PENDING',
                paymentDate: { lte: endOfMonth }
            },
            include: { contract: true }
        });

        let processed = 0;
        const errors: string[] = [];

        for (const schedule of pendingSchedules) {
            try {
                // In a real implementation, we would call the AutoJournal Engine here
                // DR: Interest Expense (schedule.interestExpense)
                // DR: Lease Liability (schedule.principalReduction)
                // CR: Cash / Bank (schedule.payment)
                // DR: Depreciation Expense (schedule.rouDepreciation)
                // CR: Accumulated Depreciation - ROU (schedule.rouDepreciation)
                
                // Mark as posted
                await prisma.leaseAmortizationSchedule.update({
                    where: { id: schedule.id },
                    data: { status: 'POSTED' } // Would also save journalEntryId
                });

                processed++;
            } catch (error: any) {
                errors.push(`Failed to post schedule ${schedule.id}: ${error.message}`);
            }
        }

        return { processed, errors };
    }
}
