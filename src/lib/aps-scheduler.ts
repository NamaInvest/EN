/**
 * APS — Advanced Planning & Scheduling (Build #33)
 * ═══════════════════════════════════════════════════
 * 
 * - جدولة أوامر التصنيع على مراكز العمل
 * - Finite capacity scheduling
 * - Gantt chart data output
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.aps-schedule' });

const db = (p: any) => p as any;

export type ScheduledJob = {
    workOrderId: number;
    workCenterId: number;
    workCenterName: string;
    productName: string;
    startTime: Date;
    endTime: Date;
    durationHours: number;
    priority: number;
    status: string;
};

export class APSScheduler {
    /**
     * Schedule work orders on work centers using priority-based finite capacity
     */
    static async schedule(
        prisma: PrismaClient,
        horizonDays: number = 14
    ): Promise<{ scheduledJobs: ScheduledJob[]; unscheduled: number[]; utilization: Record<string, number> }> {
        // Get open work orders
        const workOrders = await db(prisma).workOrder?.findMany?.({
            where: { status: { in: ['PLANNED', 'RELEASED'] } },
            include: { product: true },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        }).catch(() => []) ?? [];

        // Get work centers with capacity
        const workCenters = await db(prisma).workCenter?.findMany?.({
            where: { isActive: true },
        }).catch(() => []) ?? [];

        if (!workCenters.length) {
            return { scheduledJobs: [], unscheduled: workOrders.map((w: any) => w.id), utilization: {} };
        }

        const scheduledJobs: ScheduledJob[] = [];
        const unscheduled: number[] = [];
        const wcAvail: Record<number, Date> = {}; // next available time per WC
        const wcHours: Record<number, number> = {}; // total hours scheduled

        // Initialize WC availability
        const now = new Date();
        for (const wc of workCenters) {
            wcAvail[wc.id] = new Date(now);
            wcHours[wc.id] = 0;
        }

        const horizonEnd = new Date(now.getTime() + horizonDays * 86400000);
        const maxHoursPerWC = horizonDays * 8; // 8 hours/day

        for (const wo of workOrders) {
            const durationHours = Number(wo.estimatedHours || wo.quantity * 0.5 || 2);
            
            // Find best work center (earliest available with capacity)
            let bestWC: any = null;
            let bestStart = horizonEnd;

            for (const wc of workCenters) {
                if (wcHours[wc.id] + durationHours > maxHoursPerWC) continue;
                if (wcAvail[wc.id] < bestStart) {
                    bestStart = wcAvail[wc.id];
                    bestWC = wc;
                }
            }

            if (!bestWC || bestStart >= horizonEnd) {
                unscheduled.push(wo.id);
                continue;
            }

            const endTime = new Date(bestStart.getTime() + durationHours * 3600000);
            wcAvail[bestWC.id] = endTime;
            wcHours[bestWC.id] += durationHours;

            scheduledJobs.push({
                workOrderId: wo.id,
                workCenterId: bestWC.id,
                workCenterName: bestWC.name || `WC-${bestWC.id}`,
                productName: wo.product?.name || `Product ${wo.productId}`,
                startTime: bestStart,
                endTime,
                durationHours,
                priority: wo.priority || 0,
                status: 'SCHEDULED',
            });
        }

        // Calculate utilization
        const utilization: Record<string, number> = {};
        for (const wc of workCenters) {
            utilization[wc.name || `WC-${wc.id}`] = Math.round((wcHours[wc.id] / maxHoursPerWC) * 10000) / 100;
        }

        return { scheduledJobs, unscheduled, utilization };
    }
}
