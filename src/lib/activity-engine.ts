/**
 * Activity Scheduler Engine — tasks, calls, meetings linked to CRM records
 */
import type { PrismaClient } from '@prisma/client';
const p = (prisma: PrismaClient) => prisma as any;

export class ActivityEngine {
    static async list(prisma: PrismaClient, tenantId: string, filters?: { userId?: number; type?: string; status?: string }) {
        const where: any = { tenantId };
        if (filters?.userId) where.assignedTo = filters.userId;
        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        return p(prisma).activity?.findMany?.({ where, orderBy: { dueDate: 'asc' }, take: 50 }) || [];
    }
    static async create(prisma: PrismaClient, data: { type: string; title: string; description?: string; dueDate: string; assignedTo: number; relatedModel?: string; relatedId?: number; tenantId: string }) {
        return p(prisma).activity?.create?.({ data: { ...data, dueDate: new Date(data.dueDate), status: 'PLANNED' } }) || { id: Date.now(), ...data, status: 'PLANNED' };
    }
    static async complete(prisma: PrismaClient, id: number) {
        return p(prisma).activity?.update?.({ where: { id }, data: { status: 'DONE', completedAt: new Date() } }) || {};
    }
    static async cancel(prisma: PrismaClient, id: number) {
        return p(prisma).activity?.update?.({ where: { id }, data: { status: 'CANCELLED' } }) || {};
    }
    static async getOverdue(prisma: PrismaClient, tenantId: string) {
        return p(prisma).activity?.findMany?.({ where: { tenantId, status: 'PLANNED', dueDate: { lt: new Date() } } }) || [];
    }
    static async getTodayCount(prisma: PrismaClient, tenantId: string, userId: number) {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        return p(prisma).activity?.count?.({ where: { tenantId, assignedTo: userId, status: 'PLANNED', dueDate: { gte: start, lte: end } } }) || 0;
    }
}
