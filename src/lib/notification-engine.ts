/**
 * Notification Engine
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'notification-engine' });
const p = (prisma: PrismaClient) => prisma as any;

export class NotificationEngine {
    static async create(prisma: PrismaClient, data: { userId: number; type: string; title: string; body?: string; link?: string; tenantId: string }) {
        return p(prisma).notification?.create?.({ data: { ...data, isRead: false } }) || { id: Date.now(), ...data };
    }
    static async getForUser(prisma: PrismaClient, userId: number, limit = 20) {
        return p(prisma).notification?.findMany?.({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit }) || [];
    }
    static async getUnreadCount(prisma: PrismaClient, userId: number) {
        return p(prisma).notification?.count?.({ where: { userId, isRead: false } }) || 0;
    }
    static async markRead(prisma: PrismaClient, id: number) {
        return p(prisma).notification?.update?.({ where: { id }, data: { isRead: true } }) || {};
    }
    static async markAllRead(prisma: PrismaClient, userId: number) {
        return p(prisma).notification?.updateMany?.({ where: { userId, isRead: false }, data: { isRead: true } }) || {};
    }
    static async notifyApproval(prisma: PrismaClient, opts: { userId: number; docType: string; docId: number; tenantId: string }) {
        return this.create(prisma, { userId: opts.userId, type: 'APPROVAL', title: `موافقة مطلوبة: ${opts.docType} #${opts.docId}`, link: `/${opts.docType}/${opts.docId}`, tenantId: opts.tenantId });
    }
    static async notifyLowStock(prisma: PrismaClient, opts: { userId: number; productName: string; qty: number; tenantId: string }) {
        return this.create(prisma, { userId: opts.userId, type: 'LOW_STOCK', title: `⚠️ مخزون منخفض: ${opts.productName} (${opts.qty})`, tenantId: opts.tenantId });
    }
}
