/**
 * Accounting Service Layer
 * ──────────────────────────────────────────────────────────
 * Centralizes all accounting business logic:
 * - Journal entry creation, reversal, posting
 * - Trial balance, account resolution
 * - Period-aware operations
 * - Governance rules (control account protection)
 *
 * All API routes should delegate to this service
 * instead of embedding logic directly.
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry, ACCOUNTS } from '@/lib/auto-journal';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { AppError } from '@/lib/api-handler';

const log = logger.child({ route: 'AccountingService' });

// ── Control accounts that cannot be manually debited/credited ──
const CONTROL_ACCOUNTS = [
  ACCOUNTS.RECEIVABLES,
  ACCOUNTS.PAYABLES,
  ACCOUNTS.INVENTORY,
  ACCOUNTS.WIP,
  ACCOUNTS.FINISHED_GOODS,
  ACCOUNTS.VAT_INPUT,
  ACCOUNTS.VAT_OUTPUT,
];

export interface JournalLineInput {
  accountCode: string;
  accountId?: number;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: number;
  profitCenterId?: number;
  projectId?: number;
}

export interface CreateJournalInput {
  description: string;
  reference?: string;
  date?: string;
  lines: JournalLineInput[];
  userId?: number;
  status?: 'draft' | 'posted' | 'pending_approval';
  skipGovernance?: boolean; // for system-generated entries
  mfaToken?: string;
}

export class AccountingService {
  private prisma: PrismaClient;

  constructor(req?: Request) {
    this.prisma = getPrisma(req) as any;
  }

  // ── Journal Entry Creation ──────────────────────────────────

  async createManualJournal(input: CreateJournalInput, authUserId?: number) {
    const { description, lines, status = 'draft' } = input;

    // Validation: minimum 2 lines
    if (!lines || lines.length < 2) {
      throw new AppError('القيد يجب أن يحتوي على سطرين على الأقل', 400);
    }

    // Validation: balanced entry
    const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(`القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}`, 400);
    }

    // Governance: prevent manual posting to control accounts
    if (!input.skipGovernance) {
      const restricted = lines.some(l => CONTROL_ACCOUNTS.includes(l.accountCode));
      if (restricted) {
        // Audit violation attempt
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: authUserId || 1,
              action: 'GOVERNANCE_VIOLATION_ATTEMPT',
              tableName: 'JournalEntry',
              recordId: '0',
              details: JSON.stringify({ reason: 'Manual post to control account', lines }),
            },
          });
        } catch { /* best effort */ }
        throw new AppError('منع رقابي: يمنع إدخال قيد يدوي مباشر على حسابات المراقبة', 403);
      }
    }

    // MFA for large amounts (>100k)
    if (totalDebit > 100000 && !input.skipGovernance) {
      if (!input.mfaToken) {
        throw new AppError('القيد يتجاوز 100,000 — يتطلب تحقق ثنائي (2FA)', 403);
      }
      // MFA verification delegated to route
    }

    // Create via auto-journal engine
    const result = await createJournalEntry({
      description,
      reference: input.reference,
      date: input.date,
      lines: lines.map(l => ({
        accountCode: l.accountCode,
        costCenterId: l.costCenterId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description,
      })),
      userId: input.userId || authUserId,
      status,
    });

    if (!result.success) {
      throw new AppError(result.error || 'فشل في إنشاء القيد', 400);
    }

    log.info(`Journal created: ${result.entryId}`, { totalDebit, lines: lines.length });
    return result;
  }

  // ── Journal Listing ──────────────────────────────────

  async listJournals(filters: { from?: string; to?: string; status?: string; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (filters.from) where.entryDate = { ...(where.entryDate as object || {}), gte: filters.from };
    if (filters.to) where.entryDate = { ...(where.entryDate as object || {}), lte: filters.to };
    if (filters.status) where.status = filters.status;

    return this.prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: { select: { code: true, name: true, type: true } },
            costCenter: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
      take: filters.limit || 200,
    });
  }

  // ── Trial Balance ──────────────────────────────────

  async getTrialBalance(dateRange?: { from: string; to: string }) {
    const cacheKey = `trial_balance:${dateRange?.from || 'all'}:${dateRange?.to || 'all'}`;
    
    return cache.getOrSet(cacheKey, 30, async () => {
      const where: Record<string, unknown> = {};
      if (dateRange) {
        where.entry = {
          entryDate: { gte: dateRange.from, lte: dateRange.to },
          status: 'posted',
        };
      } else {
        where.entry = { status: 'posted' };
      }

      const lines = await this.prisma.journalLine.groupBy({
        by: ['accountId'],
        where,
        _sum: { debit: true, credit: true },
      });

      // Fetch account details
      const accountIds = lines.map(l => l.accountId);
      const accounts = await this.prisma.account.findMany({
        where: { id: { in: accountIds } },
        select: { id: true, code: true, name: true, type: true },
      });

      const accountMap = new Map(accounts.map(a => [a.id, a]));

      return lines.map(line => {
        const account = accountMap.get(line.accountId);
        return {
          accountId: line.accountId,
          accountCode: account?.code || '',
          accountName: account?.name || '',
          accountType: account?.type || '',
          totalDebit: Number(line._sum.debit || 0),
          totalCredit: Number(line._sum.credit || 0),
          balance: Number(line._sum.debit || 0) - Number(line._sum.credit || 0),
        };
      }).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    });
  }

  // ── Account Chart (cached) ──────────────────────────────────

  async getChartOfAccounts() {
    return cache.getOrSet('chart_of_accounts', 300, async () => {
      return this.prisma.account.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true, nameEn: true, type: true, parentId: true, level: true },
      });
    });
  }

  // ── Journal Reversal ──────────────────────────────────

  async reverseJournal(entryId: number, reason: string, userId?: number) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });

    if (!entry) throw new AppError('القيد غير موجود', 404);
    if (entry.status === 'reversed') throw new AppError('القيد معكوس بالفعل', 400);

    // Create reversal entry with swapped debits/credits
    const result = await createJournalEntry({
      description: `عكس: ${entry.description} — ${reason}`,
      reference: `REV-${entry.id}`,
      lines: entry.lines.map((l: any) => ({
        accountCode: l.accountCode || '',
        costCenterId: l.costCenterId,
        debit: Number(l.credit) || 0,
        credit: Number(l.debit) || 0,
        description: `عكس سطر #${l.id}`,
      })),
      userId,
      status: 'posted',
    });

    // Mark original as reversed
    if (result.success) {
      await this.prisma.journalEntry.update({
        where: { id: entryId },
        data: { status: 'reversed' },
      });
      log.info(`Journal ${entryId} reversed → ${result.entryId}`);
    }

    return result;
  }

  // ── Account Balance ──────────────────────────────────

  async getAccountBalance(accountId: number) {
    const result = await this.prisma.journalLine.aggregate({
      where: {
        accountId,
        entry: { status: 'posted' },
      },
      _sum: { debit: true, credit: true },
    });

    return {
      accountId,
      totalDebit: Number(result._sum.debit || 0),
      totalCredit: Number(result._sum.credit || 0),
      balance: Number(result._sum.debit || 0) - Number(result._sum.credit || 0),
    };
  }
}
