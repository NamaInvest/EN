/**
 * Scheduled Actions (Cron) Engine
 */
import type { PrismaClient } from '@prisma/client';
const p = (prisma: PrismaClient) => prisma as any;

export class ScheduledActionEngine {
    static async list(prisma: PrismaClient, tenantId: string) {
        return p(prisma).scheduledAction?.findMany?.({ where: { tenantId }, orderBy: { nextRun: 'asc' } }) || [];
    }
    static async create(prisma: PrismaClient, data: { name: string; actionType: string; schedule: string; config: any; tenantId: string }) {
        return p(prisma).scheduledAction?.create?.({ data: { ...data, isActive: true, lastRun: null, nextRun: new Date() } }) || { id: Date.now(), ...data };
    }
    static async toggle(prisma: PrismaClient, id: number, isActive: boolean) {
        return p(prisma).scheduledAction?.update?.({ where: { id }, data: { isActive } }) || {};
    }
    static async markRun(prisma: PrismaClient, id: number) {
        return p(prisma).scheduledAction?.update?.({ where: { id }, data: { lastRun: new Date() } }) || {};
    }
    static async getDue(prisma: PrismaClient) {
        return p(prisma).scheduledAction?.findMany?.({ where: { isActive: true, nextRun: { lte: new Date() } } }) || [];
    }
}
