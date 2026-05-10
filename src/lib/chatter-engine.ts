/**
 * Chatter/Comments Engine — Odoo-style comments on any record
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.chatter-engi' });
const p = (prisma: PrismaClient) => prisma as any;

export class ChatterEngine {
    static async getComments(prisma: PrismaClient, model: string, recordId: number) {
        return p(prisma).comment?.findMany?.({ where: { model, recordId }, orderBy: { createdAt: 'desc' }, take: 50 }) || [];
    }
    static async addComment(prisma: PrismaClient, data: { model: string; recordId: number; userId: number; body: string; tenantId: string; attachments?: any; mentions?: any }) {
        return p(prisma).comment?.create?.({ data: { ...data, type: 'COMMENT' } }) || { id: Date.now(), ...data };
    }
    static async logChange(prisma: PrismaClient, data: { model: string; recordId: number; userId: number; field: string; oldValue: string; newValue: string; tenantId: string }) {
        const body = `Changed ${data.field}: "${data.oldValue}" → "${data.newValue}"`;
        return p(prisma).comment?.create?.({ data: { model: data.model, recordId: data.recordId, userId: data.userId, body, type: 'STATUS_CHANGE', tenantId: data.tenantId } }) || {};
    }
    static async getCount(prisma: PrismaClient, model: string, recordId: number) {
        return p(prisma).comment?.count?.({ where: { model, recordId } }) || 0;
    }
}
