/**
 * Bank Feed Engine — import CSV/OFX bank statements and auto-match
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.bank-feed-en' });
const p = (prisma: PrismaClient) => prisma as any;

export class BankFeedEngine {
    static parseCSV(csvContent: string): any[] {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        return lines.slice(1).map(line => {
            const vals = line.split(',');
            const row: any = {};
            headers.forEach((h, i) => row[h] = vals[i]?.trim() || '');
            return { date: row.date || row.transaction_date || row['تاريخ'] || '', description: row.description || row.details || row['البيان'] || '', amount: parseFloat(row.amount || row.debit || row.credit || row['المبلغ'] || '0'), reference: row.reference || row.ref || row['المرجع'] || '', type: parseFloat(row.amount || row.debit || '0') < 0 ? 'DEBIT' : 'CREDIT' };
        }).filter(r => r.amount !== 0);
    }
    static async importStatement(prisma: PrismaClient, data: { bankAccountId: number; entries: any[]; tenantId: string }) {
        const results = [];
        for (const entry of data.entries) {
            const record = await p(prisma).bankFeedEntry?.create?.({ data: { bankAccountId: data.bankAccountId, date: new Date(entry.date || Date.now()), description: entry.description, amount: entry.amount, reference: entry.reference, type: entry.type, status: 'UNMATCHED', tenantId: data.tenantId } });
            results.push(record || { ...entry, status: 'UNMATCHED' });
        }
        return { imported: results.length, entries: results };
    }
    static async getEntries(prisma: PrismaClient, tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status) where.status = status;
        return p(prisma).bankFeedEntry?.findMany?.({ where, orderBy: { date: 'desc' }, take: 100 }) || [];
    }
    static async autoMatch(prisma: PrismaClient, entryId: number) {
        const entry = await p(prisma).bankFeedEntry?.findUnique?.({ where: { id: entryId } });
        if (!entry) return { matched: false };
        const payments = await p(prisma).payment?.findMany?.({ where: { amount: Math.abs(entry.amount), matched: false }, take: 5 }) || [];
        if (payments.length === 1) {
            await p(prisma).bankFeedEntry?.update?.({ where: { id: entryId }, data: { status: 'MATCHED', matchedPaymentId: payments[0].id } });
            return { matched: true, paymentId: payments[0].id };
        }
        return { matched: false, suggestions: payments.map((p: any) => ({ id: p.id, amount: p.amount, date: p.createdAt })) };
    }
}
