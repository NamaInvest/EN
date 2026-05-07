/**
 * Deferred Revenue/Expense Engine
 */
import type { PrismaClient } from '@prisma/client';
const p = (prisma: PrismaClient) => prisma as any;

export class DeferralEngine {
    static async list(prisma: PrismaClient, tenantId: string) {
        return p(prisma).deferralSchedule?.findMany?.({ where: { tenantId }, include: { entries: true }, orderBy: { startDate: 'desc' }, take: 50 }) || [];
    }
    static async create(prisma: PrismaClient, data: { invoiceId: number; lineItemId?: number; type: string; totalAmount: number; startDate: string; periods: number; tenantId: string }) {
        const start = new Date(data.startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + data.periods);
        const schedule = await p(prisma).deferralSchedule?.create?.({
            data: { invoiceId: data.invoiceId, lineItemId: data.lineItemId, type: data.type, totalAmount: data.totalAmount, startDate: start, endDate: end, periods: data.periods, tenantId: data.tenantId }
        });
        if (schedule) {
            const monthlyAmount = Math.round((data.totalAmount / data.periods) * 100) / 100;
            for (let i = 0; i < data.periods; i++) {
                const periodDate = new Date(start);
                periodDate.setMonth(periodDate.getMonth() + i);
                await p(prisma).deferralEntry?.create?.({ data: { scheduleId: schedule.id, periodDate, amount: monthlyAmount, status: 'PENDING' } });
            }
        }
        return schedule || { id: Date.now(), ...data };
    }
    static async postEntry(prisma: PrismaClient, entryId: number) {
        return p(prisma).deferralEntry?.update?.({ where: { id: entryId }, data: { status: 'POSTED' } }) || {};
    }
    static async getPending(prisma: PrismaClient, tenantId: string) {
        const now = new Date();
        return p(prisma).deferralEntry?.findMany?.({ where: { status: 'PENDING', periodDate: { lte: now }, schedule: { tenantId } }, include: { schedule: true } }) || [];
    }
}
