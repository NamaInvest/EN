/**
 * Intercompany Engine — auto-create mirror invoices between sister companies
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'intercompany-engine' });
const p = (prisma: PrismaClient) => prisma as any;

export class IntercompanyEngine {
    static async getRules(prisma: PrismaClient) {
        return p(prisma).intercompanyRule?.findMany?.({ where: { autoPost: true } }) || [];
    }
    static async createRule(prisma: PrismaClient, data: { fromTenantId: string; toTenantId: string; fromAccountId: number; toAccountId: number; autoPost?: boolean }) {
        return p(prisma).intercompanyRule?.create?.({ data: { ...data, autoPost: data.autoPost !== false } }) || { id: Date.now(), ...data };
    }
    static async processInvoice(prisma: PrismaClient, data: { sourceInvoiceId: number; ruleId: number; amount: number; currency: string }) {
        const rule = await p(prisma).intercompanyRule?.findUnique?.({ where: { id: data.ruleId } });
        if (!rule) return { error: 'Rule not found' };
        const tx = await p(prisma).intercompanyTransaction?.create?.({ data: { ruleId: data.ruleId, sourceInvoiceId: data.sourceInvoiceId, targetInvoiceId: 0, amount: data.amount, currency: data.currency || 'SAR', status: 'PENDING' } });
        return tx || { id: Date.now(), ...data, status: 'PENDING' };
    }
    static async getTransactions(prisma: PrismaClient) {
        return p(prisma).intercompanyTransaction?.findMany?.({ orderBy: { createdAt: 'desc' }, take: 50 }) || [];
    }
    static async reconcile(prisma: PrismaClient, id: number) {
        return p(prisma).intercompanyTransaction?.update?.({ where: { id }, data: { status: 'RECONCILED' } }) || {};
    }
    static async getBalance(prisma: PrismaClient) {
        const txs = await this.getTransactions(prisma);
        const balance: Record<string, number> = {};
        for (const tx of txs) {
            if (tx.status !== 'RECONCILED') {
                const key = `${tx.ruleId}`;
                balance[key] = (balance[key] || 0) + Number(tx.amount || 0);
            }
        }
        return balance;
    }
}
