// @ts-nocheck
import { PrismaClient, DeferredRevenueSchedule, RevenueRecognitionLine, AssetImpairment, AssetRevaluation } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.ifrs-engines' });

const prisma = new PrismaClient();

export class RevenueRecognitionEngine {
    
    /**
     * IFRS 15: Create a Deferred Revenue Schedule for an invoice 
     * where performance obligations are satisfied over time.
     */
    static async createSchedule(invoiceId: number, startDate: Date, endDate: Date, method: string): Promise<DeferredRevenueSchedule> {
        const invoice = await prisma.salesInvoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) throw new Error("Invoice not found");

        const totalAmount = Number(invoice.totalAmount);
        
        return await prisma.$transaction(async (tx) => {
            const schedule = await tx.deferredRevenueSchedule.create({
                data: {
                    invoiceId: invoiceId,
                    totalAmount: totalAmount,
                    recognizedAmount: 0,
                    remainingAmount: totalAmount,
                    startDate: startDate,
                    endDate: endDate,
                    recognitionMethod: method,
                    status: 'ACTIVE'
                }
            });

            if (method === 'STRAIGHT_LINE') {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                let months = (end.getFullYear() - start.getFullYear()) * 12;
                months -= start.getMonth();
                months += end.getMonth();
                const totalMonths = months <= 0 ? 1 : months;

                const monthlyAmount = Number((totalAmount / totalMonths).toFixed(2));
                
                let currentDate = new Date(start);
                
                for (let i = 0; i < totalMonths; i++) {
                    const isLast = (i === totalMonths - 1);
                    const amount = isLast ? totalAmount - (monthlyAmount * (totalMonths - 1)) : monthlyAmount;
                    
                    await tx.revenueRecognitionLine.create({
                        data: {
                            scheduleId: schedule.id,
                            periodDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), // Last day of month
                            amountToRecognize: amount,
                            isRecognized: false
                        }
                    });

                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }

            return schedule;
        });
    }

    /**
     * Period Close cron job to recognize revenue for all due lines
     */
    static async recognizeMonthlyRevenue(periodDate: Date): Promise<number> {
        const lines = await prisma.revenueRecognitionLine.findMany({
            take: 100,
            where: {
                isRecognized: false,
                periodDate: { lte: periodDate }
            },
            include: { schedule: true }
        });

        let recognizedCount = 0;

        for (const line of lines) {
            await prisma.$transaction(async (tx) => {
                await tx.revenueRecognitionLine.update({
                    where: { id: line.id },
                    data: {
                        isRecognized: true,
                        recognizedAt: new Date(),
                        // journalEntryId: newJe.id (Integration with AutoJournal)
                    }
                });

                await tx.deferredRevenueSchedule.update({
                    where: { id: line.scheduleId },
                    data: {
                        recognizedAmount: { increment: line.amountToRecognize },
                        remainingAmount: { decrement: line.amountToRecognize }
                    }
                });
                
                // Note: AutoJournal Engine should book:
                // DR: Unearned / Deferred Revenue
                // CR: Earned Revenue
                recognizedCount++;
            });
        }

        return recognizedCount;
    }
}

export class AssetImpairmentEngine {
    
    /**
     * IAS 36: Record an impairment loss when carrying amount > recoverable amount
     */
    static async recordImpairment(assetId: number, recoverableAmount: number, reason: string, userId: number): Promise<AssetImpairment> {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) throw new Error("Asset not found");

        const carryingAmount = Number(asset.currentValue || 0);

        if (carryingAmount <= recoverableAmount) {
            throw new Error("No impairment required. Recoverable amount is higher than or equal to carrying amount.");
        }

        const impairmentLoss = carryingAmount - recoverableAmount;

        return await prisma.$transaction(async (tx) => {
            const impairment = await tx.assetImpairment.create({
                data: {
                    assetId,
                    date: new Date(),
                    carryingAmount,
                    recoverableAmount,
                    impairmentLoss,
                    reason
                }
            });

            // Update Asset current value
            await tx.asset.update({
                where: { id: assetId },
                data: { currentValue: recoverableAmount }
            });

            // Note: AutoJournal Engine should book:
            // DR: Impairment Loss (P&L)
            // CR: Accumulated Impairment / Asset Value
            
            return impairment;
        });
    }

    /**
     * IAS 16: Record asset revaluation (fair value assessment)
     */
    static async revalueAsset(assetId: number, fairValue: number, evaluatorName: string): Promise<AssetRevaluation> {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) throw new Error("Asset not found");

        const carryingAmount = Number(asset.currentValue || 0);
        let surplus = 0;
        let deficit = 0;

        if (fairValue > carryingAmount) {
            surplus = fairValue - carryingAmount;
        } else if (fairValue < carryingAmount) {
            deficit = carryingAmount - fairValue;
        }

        return await prisma.$transaction(async (tx) => {
            const revaluation = await tx.assetRevaluation.create({
                data: {
                    assetId,
                    date: new Date(),
                    carryingAmount,
                    fairValue,
                    revaluationSurplus: surplus,
                    revaluationDeficit: deficit,
                    evaluatorName
                }
            });

            await tx.asset.update({
                where: { id: assetId },
                data: { currentValue: fairValue }
            });

            // Note: AutoJournal Engine should book:
            // If Surplus: DR Asset, CR Revaluation Surplus (OCI / Equity)
            // If Deficit: DR Revaluation Deficit (P&L), CR Asset
            
            return revaluation;
        });
    }
}
