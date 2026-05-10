/**
 * Contract Management Engine (G-12)
 * ══════════════════════════════════
 * Contracts lifecycle: create, renew, expire alerts, value tracking
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'contract-engine' });
const db = (p: any) => p as any;

export class ContractEngine {
    /** Create contract */
    static async create(prisma: PrismaClient, data: {
        number: string; title: string; type: string; partyId: number;
        startDate: Date; endDate: Date; value: number;
        renewalType?: string; alertDays?: number; tenantId: string;
    }) {
        return db(prisma).contract?.create?.({
            data: { ...data, status: 'ACTIVE', renewalType: data.renewalType || 'MANUAL', alertDays: data.alertDays || 30 },
        });
    }

    /** List contracts with status */
    static async list(prisma: PrismaClient, status?: string) {
        const contracts = await db(prisma).contract?.findMany?.({
            where: status ? { status } : {},
            orderBy: { endDate: 'asc' },
        }) || [];

        const now = new Date();
        return contracts.map((c: any) => {
            const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / 86400000);
            return { ...c, daysLeft, isExpiring: daysLeft <= (c.alertDays || 30) && daysLeft > 0, isExpired: daysLeft <= 0 };
        });
    }

    /** Get expiring contracts (for alerts) */
    static async getExpiring(prisma: PrismaClient, withinDays: number = 30) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + withinDays);
        return db(prisma).contract?.findMany?.({
            where: { status: 'ACTIVE', endDate: { lte: threshold, gte: new Date() } },
            orderBy: { endDate: 'asc' },
        }) || [];
    }

    /** Renew contract */
    static async renew(prisma: PrismaClient, contractId: number, newEndDate: Date, newValue?: number) {
        const contract = await db(prisma).contract?.findUnique?.({ where: { id: contractId } });
        if (!contract) throw new Error('العقد غير موجود');
        return db(prisma).contract?.update?.({
            where: { id: contractId },
            data: {
                endDate: newEndDate,
                value: newValue || contract.value,
                status: 'ACTIVE',
            },
        });
    }

    /** Terminate contract */
    static async terminate(prisma: PrismaClient, contractId: number, reason?: string) {
        return db(prisma).contract?.update?.({
            where: { id: contractId },
            data: { status: 'TERMINATED' },
        });
    }

    /** Dashboard summary */
    static async summary(prisma: PrismaClient) {
        const all = await this.list(prisma);
        return {
            total: all.length,
            active: all.filter((c: any) => c.status === 'ACTIVE').length,
            expiring: all.filter((c: any) => c.isExpiring).length,
            expired: all.filter((c: any) => c.isExpired).length,
            totalValue: all.reduce((s: number, c: any) => s + Number(c.value || 0), 0),
        };
    }
}
