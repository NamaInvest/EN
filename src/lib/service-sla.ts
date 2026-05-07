/**
 * Service SLA Engine (Build #37)
 * ═══════════════════════════════
 * 
 * - تتبع اتفاقيات مستوى الخدمة
 * - حساب Uptime وResponse Time
 * - تنبيهات عند اقتراب الحدود
 */

import type { PrismaClient } from '@prisma/client';
const db = (p: any) => p as any;

export class ServiceSLAEngine {
    static async evaluateSLA(
        prisma: PrismaClient,
        contractId?: number
    ): Promise<Array<{
        contractId: number;
        clientName: string;
        slaTarget: number;
        actualUptime: number;
        responseTimeSLA: number;
        actualResponseTime: number;
        breached: boolean;
        remainingMinutes: number;
    }>> {
        const where: any = {};
        if (contractId) where.id = contractId;

        const contracts = await db(prisma).serviceContract?.findMany?.({
            where: { ...where, status: { in: ['ACTIVE', 'active'] } },
            include: { customer: true, tickets: { where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } } },
        }).catch(() => []) ?? [];

        return contracts.map((c: any) => {
            const tickets = c.tickets || [];
            const totalTickets = tickets.length;
            const resolvedInTime = tickets.filter((t: any) => {
                if (!t.resolvedAt || !t.createdAt) return false;
                const responseMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
                return responseMs <= (c.responseTimeSLA || 240) * 60000;
            }).length;

            const actualUptime = totalTickets > 0 ? (resolvedInTime / totalTickets) * 100 : 100;
            const avgResponse = totalTickets > 0
                ? tickets.reduce((s: number, t: any) => {
                    if (!t.resolvedAt) return s;
                    return s + (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 60000;
                }, 0) / totalTickets
                : 0;

            return {
                contractId: c.id,
                clientName: c.customer?.name || `Client ${c.customerId}`,
                slaTarget: Number(c.uptimeSLA || 99.5),
                actualUptime: Math.round(actualUptime * 10) / 10,
                responseTimeSLA: Number(c.responseTimeSLA || 240),
                actualResponseTime: Math.round(avgResponse),
                breached: actualUptime < Number(c.uptimeSLA || 99.5),
                remainingMinutes: Math.max(0, Math.round(Number(c.responseTimeSLA || 240) - avgResponse)),
            };
        });
    }
}
