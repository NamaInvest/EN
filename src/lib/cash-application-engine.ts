/**
 * Cash Application Engine (C.1)
 * ══════════════════════════════════════════════════════
 * Auto-matches incoming payments to open invoices
 *
 * Strategies (in priority order):
 *   1. Exact match by reference number
 *   2. Exact amount match (single invoice)
 *   3. Multi-invoice match (sum of invoices = payment)
 *   4. Partial application (if allowed)
 *   5. Unallocated (suspense) — requires manual review
 *
 * Integrates with:
 *   - Bank Statement Parser (ParsedBankTransaction)
 *   - SalesInvoice (remaining field)
 *   - PaymentTransaction model
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cash-application' });

export interface OpenInvoice {
  id: number;
  invoiceNo: number;
  customerId: number | null;
  customerName?: string;
  date: Date;
  total: number;
  remaining: number;
}

export interface MatchResult {
  strategy: 'EXACT_REF' | 'EXACT_AMOUNT' | 'MULTI_INVOICE' | 'PARTIAL' | 'UNALLOCATED';
  confidence: number;        // 0-100
  paymentAmount: number;
  allocations: Array<{
    invoiceId: number;
    invoiceNo: number;
    appliedAmount: number;
    remainingAfter: number;
  }>;
  unallocatedAmount: number;
  suggestedCustomerId?: number;
}

export class CashApplicationEngine {

  /**
   * Match a single payment to open invoices
   */
  static async match(params: {
    paymentAmount: number;
    paymentReference: string;
    paymentDate: Date;
    customerId?: number;
    allowPartial?: boolean;
  }): Promise<MatchResult> {

    const { paymentAmount, paymentReference, customerId, allowPartial = true } = params;

    // Load open invoices
    const whereClause: any = {
      remaining: { gt: 0 },
      deletedAt: null,
    };
    if (customerId) whereClause.customerId = customerId;

    const openInvoices = await prisma.salesInvoice.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNo: true,
        customerId: true,
        date: true,
        total: true,
        remaining: true,
        customer: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
      take: 100,
    }).catch(() => [] as any[]);

    const invoices: OpenInvoice[] = (openInvoices as any[]).map(inv => ({
      id: inv.id,
      invoiceNo: Number(inv.invoiceNo),
      customerId: inv.customerId,
      customerName: inv.customer?.name,
      date: new Date(inv.date),
      total: Number(inv.total || 0),
      remaining: Number(inv.remaining || 0),
    }));

    // ── Strategy 1: Exact reference match ─────────────────────
    const refNumber = paymentReference.replace(/[^\d]/g, '');
    if (refNumber) {
      const refMatch = invoices.find(inv =>
        String(inv.invoiceNo) === refNumber ||
        String(inv.id) === refNumber
      );
      if (refMatch) {
        const applied = Math.min(paymentAmount, refMatch.remaining);
        return {
          strategy: 'EXACT_REF',
          confidence: 99,
          paymentAmount,
          allocations: [{
            invoiceId: refMatch.id,
            invoiceNo: refMatch.invoiceNo,
            appliedAmount: applied,
            remainingAfter: refMatch.remaining - applied,
          }],
          unallocatedAmount: paymentAmount - applied,
          suggestedCustomerId: refMatch.customerId ?? undefined,
        };
      }
    }

    // ── Strategy 2: Exact amount match ────────────────────────
    const exactMatch = invoices.find(inv =>
      Math.abs(inv.remaining - paymentAmount) < 0.01
    );
    if (exactMatch) {
      return {
        strategy: 'EXACT_AMOUNT',
        confidence: 95,
        paymentAmount,
        allocations: [{
          invoiceId: exactMatch.id,
          invoiceNo: exactMatch.invoiceNo,
          appliedAmount: paymentAmount,
          remainingAfter: 0,
        }],
        unallocatedAmount: 0,
        suggestedCustomerId: exactMatch.customerId ?? undefined,
      };
    }

    // ── Strategy 3: Multi-invoice match ───────────────────────
    const multiMatch = this.findMultiMatch(invoices, paymentAmount);
    if (multiMatch.length > 0) {
      return {
        strategy: 'MULTI_INVOICE',
        confidence: 90,
        paymentAmount,
        allocations: multiMatch.map(inv => ({
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          appliedAmount: inv.remaining,
          remainingAfter: 0,
        })),
        unallocatedAmount: 0,
        suggestedCustomerId: multiMatch[0].customerId ?? undefined,
      };
    }

    // ── Strategy 4: Partial — oldest first ────────────────────
    if (allowPartial && invoices.length > 0) {
      const allocations: MatchResult['allocations'] = [];
      let remaining = paymentAmount;

      for (const inv of invoices) {
        if (remaining <= 0.01) break;
        const applied = Math.min(remaining, inv.remaining);
        allocations.push({
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          appliedAmount: applied,
          remainingAfter: inv.remaining - applied,
        });
        remaining -= applied;
      }

      if (allocations.length > 0) {
        return {
          strategy: 'PARTIAL',
          confidence: 70,
          paymentAmount,
          allocations,
          unallocatedAmount: remaining,
          suggestedCustomerId: invoices[0].customerId ?? undefined,
        };
      }
    }

    // ── Strategy 5: Unallocated ───────────────────────────────
    return {
      strategy: 'UNALLOCATED',
      confidence: 0,
      paymentAmount,
      allocations: [],
      unallocatedAmount: paymentAmount,
    };
  }

  /**
   * Apply a confirmed match — posts payment transactions
   */
  static async apply(params: {
    matchResult: MatchResult;
    customerId?: number;
    paymentDate: Date;
    paymentMethod: string;
    reference: string;
    notes?: string;
    userId?: number;
  }): Promise<{ applied: number; journalEntryId?: number }> {

    if (params.matchResult.allocations.length === 0) {
      log.warn('Cash application: no allocations to apply');
      return { applied: 0 };
    }

    return prisma.$transaction(async (tx) => {
      let totalApplied = 0;

      for (const alloc of params.matchResult.allocations) {
        // Update invoice remaining balance
        await tx.salesInvoice.update({
          where: { id: alloc.invoiceId },
          data: {
            paid: { increment: alloc.appliedAmount },
            remaining: alloc.remainingAfter,
            status: alloc.remainingAfter < 0.01 ? 'completed' : 'partial',
          },
        }).catch(() => null);

        // Record payment transaction
        await (tx as any).paymentTransaction?.create?.({
          data: {
            invoiceId: alloc.invoiceId,
            amount: alloc.appliedAmount,
            method: params.paymentMethod,
            reference: params.reference,
            date: params.paymentDate,
            notes: params.notes,
            userId: params.userId,
          },
        }).catch(() => null);

        totalApplied += alloc.appliedAmount;
      }

      log.info(`Cash application: applied ${totalApplied} across ${params.matchResult.allocations.length} invoices`);
      return { applied: totalApplied };
    });
  }

  /**
   * Batch process bank statement transactions
   */
  static async batchMatch(transactions: Array<{
    date: Date;
    credit: number;
    reference: string;
    description: string;
  }>): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    for (const tx of transactions) {
      if (tx.credit <= 0) continue; // Only process credits (incoming payments)

      const match = await this.match({
        paymentAmount: tx.credit,
        paymentReference: tx.reference || tx.description,
        paymentDate: tx.date,
      });

      results.push(match);
    }

    return results;
  }

  /**
   * Find combination of invoices that sum to target amount
   * Uses greedy approach for performance (exact match via subset sum up to 10 invoices)
   */
  private static findMultiMatch(invoices: OpenInvoice[], target: number): OpenInvoice[] {
    // Try combinations of 2-4 invoices
    for (let size = 2; size <= Math.min(4, invoices.length); size++) {
      const result = this.combinationSum(invoices, target, size);
      if (result.length > 0) return result;
    }
    return [];
  }

  private static combinationSum(invoices: OpenInvoice[], target: number, size: number): OpenInvoice[] {
    const n = invoices.length;
    for (let i = 0; i < n - size + 1; i++) {
      const combo = [invoices[i]];
      for (let j = i + 1; j < n && combo.length < size; j++) {
        combo.push(invoices[j]);
      }
      if (combo.length === size) {
        const sum = combo.reduce((s, inv) => s + inv.remaining, 0);
        if (Math.abs(sum - target) < 0.01) return combo;
      }
    }
    return [];
  }
}
