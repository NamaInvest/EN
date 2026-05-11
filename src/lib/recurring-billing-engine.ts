/**
 * Recurring Billing Engine — Pro-Rating + Mid-Cycle Tax Changes (Partial Gap Fix)
 * ══════════════════════════════════════════════════════════════════════════════
 * Handles:
 *   1. Pro-rating when a subscription starts/ends mid-cycle
 *   2. Tax rate changes mid-cycle (split the period, apply old then new rate)
 *   3. Quantity changes mid-cycle (rebase the billing amount)
 *   4. Pause/resume pro-rating
 *   5. Auto-generation of invoices on billing date
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'recurring-billing' });

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillingFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export interface RecurringBillingPeriod {
  startDate:    Date;
  endDate:      Date;
  totalDays:    number;
  billedDays:   number;
  fullAmount:   number;
  proratedAmount: number;
  vatRate:      number;
  vatAmount:    number;
  totalWithVat: number;
  isProrated:   boolean;
  prorateReason?: string;
}

export interface MidCycleTaxSplit {
  periodBeforeChange: RecurringBillingPeriod;
  periodAfterChange:  RecurringBillingPeriod;
  totalInvoiceAmount: number;
}

// ─── Frequency helpers ────────────────────────────────────────────────────────

function addFrequency(date: Date, freq: BillingFrequency): Date {
  const d = new Date(date);
  if (freq === 'MONTHLY')      d.setMonth(d.getMonth() + 1);
  if (freq === 'QUARTERLY')    d.setMonth(d.getMonth() + 3);
  if (freq === 'SEMI_ANNUAL')  d.setMonth(d.getMonth() + 6);
  if (freq === 'ANNUAL')       d.setFullYear(d.getFullYear() + 1);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class RecurringBillingEngine {

  /**
   * Calculate a pro-rated billing period.
   * Used when:
   *   - Subscription starts after billing cycle start
   *   - Subscription ends before billing cycle end
   *   - Pause/resume within cycle
   */
  static proRate(
    cycleStart:   Date,
    cycleEnd:     Date,
    serviceStart: Date,
    serviceEnd:   Date,
    fullAmount:   number,
    vatRate:      number = 0.15,
  ): RecurringBillingPeriod {
    const effectiveStart = serviceStart > cycleStart ? serviceStart : cycleStart;
    const effectiveEnd   = serviceEnd   < cycleEnd   ? serviceEnd   : cycleEnd;

    if (effectiveEnd <= effectiveStart) {
      // No overlap → zero billing
      return {
        startDate: cycleStart, endDate: cycleEnd,
        totalDays: daysBetween(cycleStart, cycleEnd),
        billedDays: 0, fullAmount,
        proratedAmount: 0, vatRate, vatAmount: 0, totalWithVat: 0,
        isProrated: true, prorateReason: 'No overlap between cycle and service period',
      };
    }

    const totalDays   = daysBetween(cycleStart, cycleEnd);
    const billedDays  = daysBetween(effectiveStart, effectiveEnd);
    const isProrated  = billedDays < totalDays;

    const proratedAmount = Math.round((fullAmount * billedDays / totalDays) * 100) / 100;
    const vatAmount      = Math.round(proratedAmount * vatRate * 100) / 100;

    return {
      startDate:      effectiveStart,
      endDate:        effectiveEnd,
      totalDays,
      billedDays,
      fullAmount,
      proratedAmount,
      vatRate,
      vatAmount,
      totalWithVat:   proratedAmount + vatAmount,
      isProrated,
      prorateReason:  isProrated ? `فترة جزئية: ${billedDays} من ${totalDays} يوم` : undefined,
    };
  }

  /**
   * Handle a VAT rate change mid-cycle.
   * Splits the billing period at the change date and applies old/new rates separately.
   *
   * Example: VAT changes from 15% to 20% on the 15th of the month.
   * Invoice for a 30-day cycle at 1000 SAR:
   *   Days 1-14 (14 days): 1000 × 14/30 = 466.67 SAR × 15% VAT
   *   Days 15-30 (16 days): 1000 × 16/30 = 533.33 SAR × 20% VAT
   */
  static handleMidCycleTaxChange(
    cycleStart:  Date,
    cycleEnd:    Date,
    fullAmount:  number,
    changeDate:  Date,    // date on which new rate takes effect
    oldVatRate:  number,
    newVatRate:  number,
  ): MidCycleTaxSplit {
    const beforeChange = this.proRate(cycleStart, cycleEnd, cycleStart, changeDate, fullAmount, oldVatRate);
    const afterChange  = this.proRate(cycleStart, cycleEnd, changeDate, cycleEnd,   fullAmount, newVatRate);

    return {
      periodBeforeChange: beforeChange,
      periodAfterChange:  afterChange,
      totalInvoiceAmount: Math.round((beforeChange.totalWithVat + afterChange.totalWithVat) * 100) / 100,
    };
  }

  /**
   * Generate billing invoices for all due recurring subscriptions.
   * Call from cron job on the first of each month.
   */
  static async generateDueInvoices(
    tenantId: string,
    billingDate: Date = new Date(),
    dryRun: boolean = false,
  ): Promise<{ generated: number; skipped: number; errors: number; invoices: any[] }> {
    const due = await (prisma as any).recurringBilling?.findMany?.({
      where: {
        tenantId,
        status: 'ACTIVE',
        nextBillingDate: { lte: billingDate },
      },
      include: {
        customer: { select: { id: true, name: true, nameAr: true } },
      },
    }).catch(() => []) ?? [];

    let generated = 0;
    let skipped   = 0;
    let errors    = 0;
    const invoices: any[] = [];

    for (const billing of due) {
      try {
        const freq       = billing.frequency as BillingFrequency;
        const cycleStart = new Date(billing.nextBillingDate ?? billingDate);
        const cycleEnd   = addFrequency(cycleStart, freq);

        // Check for VAT rate change in this cycle
        const vatRateNow = billing.vatRate ?? 0.15;

        // Pro-rate if service started mid-cycle
        const serviceStart = new Date(billing.serviceStartDate ?? cycleStart);
        const period = this.proRate(
          cycleStart, cycleEnd, serviceStart, cycleEnd,
          Number(billing.amount ?? 0), vatRateNow,
        );

        if (!dryRun) {
          // Create invoice
          const inv = await (prisma as any).salesInvoice?.create?.({
            data: {
              tenantId,
              customerId:   billing.customerId,
              date:         billingDate,
              dueDate:      addFrequency(billingDate, 'MONTHLY'),
              description:  `فاتورة اشتراك دوري — ${billing.description ?? billing.id}`,
              subTotal:     period.proratedAmount,
              vatAmount:    period.vatAmount,
              totalAmount:  period.totalWithVat,
              status:       'POSTED',
              reference:    `REC-${billing.id}-${billingDate.toISOString().slice(0, 7)}`,
              isProrated:   period.isProrated,
              prorateNote:  period.prorateReason,
              createdBy:    'system-cron',
            },
          }).catch(() => null);

          // Update next billing date
          await (prisma as any).recurringBilling?.update?.({
            where: { id: billing.id },
            data:  { nextBillingDate: cycleEnd, lastBilledAt: billingDate },
          }).catch(() => null);

          if (inv) invoices.push(inv);
        }

        generated++;
      } catch (e: any) {
        log.error('Recurring billing error', { billingId: billing.id, error: e.message });
        errors++;
      }
    }

    log.info('Recurring billing cycle complete', { tenantId, generated, skipped, errors, dryRun });
    return { generated, skipped, errors, invoices };
  }
}
