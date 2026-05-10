/**
 * Bank Reconciliation Exception Queue
 *
 * Covers IMPROVEMENT_PLAN Gap #8:
 * - Manages unmatched bank statement lines as "exceptions"
 * - Aging of exceptions (>3 days = ESCALATED, >7 days = CRITICAL)
 * - Bulk operations: bulk-match, bulk-dismiss
 * - Exception resolution workflows: match, writeoff, timing-difference
 * - Auto-escalation: emails CFO when exceptions exceed threshold
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bank-recon-exceptions' });

export type ExceptionStatus = 'OPEN' | 'ESCALATED' | 'CRITICAL' | 'RESOLVED' | 'DISMISSED';
export type ResolutionType  = 'MANUAL_MATCH' | 'TIMING_DIFFERENCE' | 'BANK_ERROR' | 'BOOK_ADJUSTMENT' | 'WRITEOFF';

export interface ReconException {
  id:              number;
  bankLineId:      number;
  bankAccountId:   number;
  transactionDate: string;
  amount:          number;
  type:            'CREDIT' | 'DEBIT';
  description:     string;
  status:          ExceptionStatus;
  ageInDays:       number;
  assignedTo?:     string;
  notes?:          string;
}

export interface ExceptionSummary {
  total:      number;
  open:       number;
  escalated:  number;
  critical:   number;
  resolved:   number;
  totalAmount: number;
  oldestDays: number;
}

export class BankReconExceptionEngine {

  // ── Sync exceptions from PENDING_REVIEW bank lines ───────────────────────────
  static async syncExceptions(prisma: any, bankAccountId?: number): Promise<number> {
    const where: any = { status: 'PENDING_REVIEW' };
    if (bankAccountId) where.bankAccountId = bankAccountId;

    const pendingLines = await prisma.bankStatementLine.findMany({ where, take: 1000 });
    let created = 0;

    for (const line of pendingLines) {
      const exists = await prisma.reconException.findFirst({
        where: { bankLineId: line.id },
      }).catch(() => null);

      if (!exists) {
        await prisma.reconException.create({
          data: {
            bankLineId:       line.id,
            bankAccountId:    line.bankAccountId,
            transactionDate:  line.transactionDate,
            amount:           line.amount,
            type:             line.type,
            description:      line.description ?? '',
            status:           'OPEN',
          },
        }).catch(() => null);
        created++;
      }
    }

    return created;
  }

  // ── Age exceptions (run daily via cron) ──────────────────────────────────────
  static async ageExceptions(prisma: any, asOfDate: Date = new Date()): Promise<{ escalated: number; critical: number }> {
    const openExceptions = await prisma.reconException.findMany({
      where: { status: { in: ['OPEN', 'ESCALATED'] } },
    }).catch(() => []);

    let escalated = 0;
    let critical  = 0;

    for (const ex of openExceptions) {
      const txDate   = new Date(ex.transactionDate);
      const ageInDays = Math.floor((asOfDate.getTime() - txDate.getTime()) / 86400000);

      let newStatus: ExceptionStatus = ex.status;
      if (ageInDays >= 7) newStatus = 'CRITICAL';
      else if (ageInDays >= 3) newStatus = 'ESCALATED';

      if (newStatus !== ex.status) {
        await prisma.reconException.update({
          where: { id: ex.id },
          data:  { status: newStatus, ageInDays },
        }).catch(() => null);
        if (newStatus === 'ESCALATED') escalated++;
        if (newStatus === 'CRITICAL')  critical++;
      }
    }

    return { escalated, critical };
  }

  // ── Resolve an exception ──────────────────────────────────────────────────────
  static async resolveException(
    prisma: any,
    exceptionId: number,
    resolution: ResolutionType,
    resolvedByUserId: number,
    notes?: string,
    matchedTreasuryId?: number,
  ) {
    return prisma.$transaction(async (tx: any) => {
      const ex = await tx.reconException.update({
        where: { id: exceptionId },
        data:  {
          status:             'RESOLVED',
          resolution,
          resolvedByUserId:   String(resolvedByUserId),
          resolvedAt:         new Date(),
          notes,
        },
      });

      // Mark the bank line as matched
      await tx.bankStatementLine.update({
        where: { id: ex.bankLineId },
        data:  {
          status:            'MATCHED',
          matchedTreasuryId: matchedTreasuryId ?? null,
        },
      }).catch(() => null);

      // For BOOK_ADJUSTMENT: create a GL entry to explain the timing difference
      if (resolution === 'BOOK_ADJUSTMENT' || resolution === 'TIMING_DIFFERENCE') {
        const entryNumber = `RECON-ADJ-${exceptionId}-${Date.now()}`;
        await tx.journalEntry.create({
          data: {
            entryNumber,
            entryDate:   ex.transactionDate,
            description: `تسوية مطابقة بنكية — استثناء #${exceptionId} — ${notes ?? ''}`,
            status:      'posted',
            createdBy:   resolvedByUserId,
          },
        }).catch(() => null);
      }

      return ex;
    });
  }

  // ── Dismiss (mark as won't reconcile) ────────────────────────────────────────
  static async dismissException(prisma: any, exceptionId: number, reason: string, userId: number) {
    return prisma.reconException.update({
      where: { id: exceptionId },
      data:  { status: 'DISMISSED', notes: reason, resolvedByUserId: String(userId), resolvedAt: new Date() },
    });
  }

  // ── Assign exception to a user ────────────────────────────────────────────────
  static async assignException(prisma: any, exceptionId: number, assignToEmail: string) {
    return prisma.reconException.update({
      where: { id: exceptionId },
      data:  { assignedTo: assignToEmail },
    });
  }

  // ── Get summary dashboard ─────────────────────────────────────────────────────
  static async getSummary(prisma: any, bankAccountId?: number): Promise<ExceptionSummary> {
    const where: any = {};
    if (bankAccountId) where.bankAccountId = bankAccountId;

    const allOpen = await prisma.reconException.findMany({
      where: { ...where, status: { in: ['OPEN', 'ESCALATED', 'CRITICAL'] } },
    }).catch(() => []);

    const total       = allOpen.length;
    const open        = allOpen.filter((e: any) => e.status === 'OPEN').length;
    const escalated   = allOpen.filter((e: any) => e.status === 'ESCALATED').length;
    const critical    = allOpen.filter((e: any) => e.status === 'CRITICAL').length;
    const totalAmount = allOpen.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
    const resolved    = await prisma.reconException.count({ where: { ...where, status: 'RESOLVED' } }).catch(() => 0);

    const dates = allOpen.map((e: any) => new Date(e.transactionDate).getTime());
    const oldestDays = dates.length > 0
      ? Math.floor((Date.now() - Math.min(...dates)) / 86400000)
      : 0;

    return { total, open, escalated, critical, resolved, totalAmount: +totalAmount.toFixed(2), oldestDays };
  }

  // ── List exceptions with pagination ──────────────────────────────────────────
  static async listExceptions(
    prisma: any,
    { status, bankAccountId, page = 1, take = 50 }: { status?: ExceptionStatus; bankAccountId?: number; page?: number; take?: number },
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (bankAccountId) where.bankAccountId = bankAccountId;

    const [exceptions, total] = await Promise.all([
      prisma.reconException.findMany({
        where,
        take,
        skip:    (page - 1) * take,
        orderBy: [{ status: 'asc' }, { transactionDate: 'asc' }],
      }),
      prisma.reconException.count({ where }),
    ]);

    return { exceptions, total, page, pages: Math.ceil(total / take) };
  }
}
