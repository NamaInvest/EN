import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.revenue-reco' });

export class RevenueRecognitionEngine {
    static async generateSchedule(obligationId: number) {
        const obligation = await prisma.performanceObligation.findUnique({
            where: { id: obligationId }
        });

        if (!obligation) throw new Error("Performance Obligation not found");

        // Create DeferredRevenueSchedule first
        const schedule = await prisma.deferredRevenueSchedule.create({
            data: {
                performanceObligationId: obligationId,
                totalAmount: obligation.allocatedAmount,
                recognitionStartDate: obligation.startDate || new Date(),
                recognitionEndDate: obligation.endDate || new Date(),
                frequency: 'MONTHLY',
                totalLines: 0 // Will update later
            }
        });

        // Simulate creating schedule lines based on recognitionPattern
        const linesData = [];
        if (obligation.recognitionPattern === 'OVER_TIME_STRAIGHT_LINE' && obligation.endDate && obligation.startDate) {
            const months = (obligation.endDate.getFullYear() - obligation.startDate.getFullYear()) * 12 
                         + (obligation.endDate.getMonth() - obligation.startDate.getMonth());
            
            const totalMonths = months || 1;
            const monthlyAmount = Number(obligation.allocatedAmount) / totalMonths;

            let current = new Date(obligation.startDate);
            for (let i = 0; i < totalMonths; i++) {
                linesData.push({
                    scheduleId: schedule.id,
                    performanceObligationId: obligationId,
                    lineNumber: i + 1,
                    recognitionDate: new Date(current),
                    scheduledAmount: monthlyAmount,
                    status: 'PENDING'
                });
                current.setMonth(current.getMonth() + 1);
            }
        } else if (obligation.recognitionPattern === 'POINT_IN_TIME') {
            linesData.push({
                scheduleId: schedule.id,
                performanceObligationId: obligationId,
                lineNumber: 1,
                recognitionDate: obligation.endDate || obligation.startDate || new Date(),
                scheduledAmount: Number(obligation.allocatedAmount),
                status: 'PENDING'
            });
        }

        // Insert schedules lines
        if (linesData.length > 0) {
            await prisma.revenueRecognitionLine.createMany({ data: linesData });
            await prisma.deferredRevenueSchedule.update({
                where: { id: schedule.id },
                data: { totalLines: linesData.length }
            });
        }

        return true;
    }

    static async runRecognitionForPeriod(periodEnd: Date) {
        const pendingLines = await prisma.revenueRecognitionLine.findMany({
            take: 100,
            where: {
                recognitionDate: { lte: periodEnd },
                status: 'PENDING'
            }
        });

        for (const line of pendingLines) {
            // Generate Journal Entry
            // DR: Deferred Revenue
            // CR: Revenue

            await prisma.revenueRecognitionLine.update({
                where: { id: line.id },
                data: {
                    status: 'RECOGNIZED',
                    recognizedAmount: line.scheduledAmount,
                    recognizedAt: new Date(),
                    journalEntryId: 999999 // Placeholder ID until hooked to real auto-journal
                }
            });
        }

        return pendingLines.length;
    }
}
