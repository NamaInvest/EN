// @ts-nocheck
import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.mps-engine.t' });

export class MPSEngine {

    /**
     * Generate Master Production Schedule
     */
    static async generateMPS(period: string, demandData: { productId: number, scheduledQty: number, source: any }[]) {
        return prisma.$transaction(async (tx) => {
            const results = [];
            for (const item of demandData) {
                const mps = await (tx as any).masterProductionSchedule.create({
                    data: {
                        period,
                        productId: item.productId,
                        scheduledQty: item.scheduledQty,
                        demandSource: JSON.stringify(item.source),
                        status: 'DRAFT'
                    }
                });
                results.push(mps);
            }
            return results;
        });
    }

    /**
     * Capacity Check
     */
    static async capacityCheck(workCenterId: number, date: Date, hoursNeeded: number) {
        const calendar = await (prisma as any).capacityCalendar.findUnique({
            where: { workCenterId_date: { workCenterId, date } }
        });

        if (!calendar) return { hasCapacity: true, available: 8 };

        const available = calendar.availableHours - calendar.plannedHours;
        return {
            hasCapacity: available >= hoursNeeded,
            available
        };
    }

    /**
     * Schedule an operation
     */
    static async scheduleOperation(data: {
        manufacturingOrderId: number;
        operationId: number;
        workCenterId: number;
        plannedStart: Date;
        plannedEnd: Date;
        hoursNeeded: number;
    }) {
        return prisma.$transaction(async (tx) => {
            // Update capacity
            await (tx as any).capacityCalendar.upsert({
                where: { workCenterId_date: { workCenterId: data.workCenterId, date: data.plannedStart } },
                update: {
                    plannedHours: { increment: data.hoursNeeded }
                },
                create: {
                    workCenterId: data.workCenterId,
                    date: data.plannedStart,
                    availableHours: 8,
                    plannedHours: data.hoursNeeded
                }
            });

            // Create operation
            return (tx as any).scheduledOperation.create({
                data: {
                    manufacturingOrderId: data.manufacturingOrderId,
                    operationId: data.operationId,
                    workCenterId: data.workCenterId,
                    plannedStart: data.plannedStart,
                    plannedEnd: data.plannedEnd,
                    status: 'SCHEDULED'
                }
            });
        });
    }
}
