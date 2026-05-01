import { prisma } from './prisma';

export class RevenueRecognitionEngine {
    static async generateSchedule(obligationId: number) {
        const obligation = await prisma.performanceObligation.findUnique({
            where: { id: obligationId }
        });

        if (!obligation) throw new Error("Performance Obligation not found");

        // Simulate creating schedule based on recognitionMethod
        const schedules = [];
        if (obligation.recognitionMethod === 'over_time_straight' && obligation.endDate) {
            const months = (obligation.endDate.getFullYear() - obligation.startDate.getFullYear()) * 12 
                         + (obligation.endDate.getMonth() - obligation.startDate.getMonth());
            
            const monthlyAmount = Number(obligation.allocatedAmount) / (months || 1);

            let current = new Date(obligation.startDate);
            for (let i = 0; i < (months || 1); i++) {
                schedules.push({
                    obligationId,
                    period: new Date(current),
                    recognizedAmount: monthlyAmount
                });
                current.setMonth(current.getMonth() + 1);
            }
        } else if (obligation.recognitionMethod === 'point_in_time') {
            schedules.push({
                obligationId,
                period: obligation.endDate || obligation.startDate,
                recognizedAmount: Number(obligation.allocatedAmount)
            });
        }

        // Insert schedules
        for (const sched of schedules) {
            await prisma.revenueSchedule.create({ data: sched });
        }

        return true;
    }

    static async runRecognitionForPeriod(periodEnd: Date) {
        const pendingSchedules = await prisma.revenueSchedule.findMany({
            where: {
                period: { lte: periodEnd },
                journalEntryId: null
            }
        });

        for (const sched of pendingSchedules) {
            // Generate Journal Entry
            // DR: Deferred Revenue
            // CR: Revenue

            await prisma.revenueSchedule.update({
                where: { id: sched.id },
                data: {
                    journalEntryId: 999999 // Placeholder ID until hooked to real auto-journal
                }
            });
        }

        return pendingSchedules.length;
    }
}
