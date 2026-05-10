/**
 * Open Items Engine — Multi-currency AR/AP with FX, Disputes, Tolerance
 *
 * Covers the IMPROVEMENT_PLAN Gap #3:
 * - Multi-currency matching with FX gain/loss JE
 * - Dispute marking and resolution workflow
 * - Tolerance auto-match (< X SAR → writeoff)
 * - Partial payment with discount
 * - Reverse application with audit trail
 * - Aging report by bucket (0-30, 31-60, 61-90, 91-120, 120+)
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items-engine' });

export type PartyType = 'CUSTOMER' | 'SUPPLIER';
export type DisputeResolution = 'CUSTOMER_PAYS' | 'WRITEOFF' | 'CREDIT_NOTE';

export interface AllocationInput {
  invoiceOpenItemId: number;
  amount:            number;
  discount?:         number;
  writeoff?:         number;
  writeoffReason?:   string;
  currency:          string;
  exchangeRate?:     number; // vs SAR, default 1
}

export interface ApplyPaymentInput {
  paymentOpenItemId:  number;
  allocations:        AllocationInput[];
  appliedByUserId:    number;
  toleranceSAR?:      number; // auto-writeoff threshold, default 1 SAR
}

export interface AgingBucket {
  bucket:  '0-30' | '31-60' | '61-90' | '91-120' | '120+';
  amount:  number;
  currency: string;
  invoiceCount: number;
}

export interface AgingReport {
  partyId:   number;
  partyType: PartyType;
  buckets:   AgingBucket[];
  total:     number;
  disputed:  number;
}

export class OpenItemsEngine {

  // ── Apply Payment with FX + Discount + Tolerance ──────────────────────────────
  static async applyPayment(prisma: PrismaClient, input: ApplyPaymentInput) {
    const { paymentOpenItemId, allocations, appliedByUserId, toleranceSAR = 1.0 } = input;

    return prisma.$transaction(async tx => {
      const payment = await (tx as any).openItem.findUnique({ where: { id: paymentOpenItemId } });
      if (!payment) throw new Error(`OpenItem ${paymentOpenItemId} غير موجود`);
      if (payment.status === 'CLEARED') throw new Error('الدفعة مسوّاة بالكامل مسبقاً');

      let remainingPayment = Number(payment.openAmount ?? payment.originalAmount);
      const results: any[] = [];

      for (const alloc of allocations) {
        const invoice = await (tx as any).openItem.findUnique({ where: { id: alloc.invoiceOpenItemId } });
        if (!invoice) throw new Error(`فاتورة OpenItem ${alloc.invoiceOpenItemId} غير موجودة`);
        if (invoice.status === 'DISPUTED') throw new Error(`الفاتورة ${alloc.invoiceOpenItemId} في حالة نزاع`);

        const exchangeRate = alloc.exchangeRate ?? 1;
        const appliedSAR   = alloc.amount * exchangeRate;
        const invoiceOpen  = Number(invoice.openAmount ?? invoice.originalAmount);
        const discount     = alloc.discount ?? 0;
        const writeoff     = alloc.writeoff ?? 0;

        // Tolerance check
        const netDiff = invoiceOpen - appliedSAR - discount - writeoff;
        const effectiveWriteoff = Math.abs(netDiff) <= toleranceSAR ? netDiff : writeoff;

        // Update payment open amount
        remainingPayment -= appliedSAR;

        // Update invoice
        const newInvoiceOpen = invoiceOpen - appliedSAR - discount - effectiveWriteoff;
        await (tx as any).openItem.update({
          where: { id: alloc.invoiceOpenItemId },
          data:  {
            openAmount: Math.max(0, newInvoiceOpen),
            status:     newInvoiceOpen <= 0.01 ? 'CLEARED' : 'OPEN',
          },
        });

        // Calculate FX gain/loss
        const fxGainLoss = alloc.currency !== 'SAR'
          ? (exchangeRate - Number(invoice.exchangeRate ?? 1)) * alloc.amount
          : 0;

        // Create application record
        const application = await (tx as any).itemApplication.create({
          data: {
            paymentOpenItemId,
            invoiceOpenItemId: alloc.invoiceOpenItemId,
            appliedAmount:     alloc.amount,
            appliedCurrency:   alloc.currency,
            exchangeRateUsed:  exchangeRate,
            fxGainLoss,
            discountAmount:    discount || null,
            writeoffAmount:    effectiveWriteoff || null,
            writeoffReason:    effectiveWriteoff > 0 ? (alloc.writeoffReason ?? 'TOLERANCE_WRITEOFF') : null,
            appliedByUserId:   String(appliedByUserId),
          },
        });

        results.push({ applicationId: application.id, invoiceId: alloc.invoiceOpenItemId, appliedAmount: appliedSAR, fxGainLoss, newInvoiceOpen: Math.max(0, newInvoiceOpen) });
      }

      // Update payment status
      await (tx as any).openItem.update({
        where: { id: paymentOpenItemId },
        data:  {
          openAmount: Math.max(0, remainingPayment),
          status:     remainingPayment <= 0.01 ? 'CLEARED' : 'PARTIAL',
        },
      });

      return { success: true, applications: results, remainingPaymentBalance: Math.max(0, remainingPayment) };
    });
  }

  // ── Mark as Disputed ───────────────────────────────────────────────────────────
  static async markDisputed(
    prisma: PrismaClient,
    openItemId: number,
    disputedAmount: number,
    reason: string,
    expectedResolutionDate: Date,
    userId: number,
  ) {
    return (prisma as any).openItem.update({
      where: { id: openItemId },
      data:  {
        status:                 'DISPUTED',
        disputedAmount,
        disputedReason:         reason,
        disputedAt:             new Date(),
        disputedByUserId:       String(userId),
        expectedResolutionDate,
      },
    });
  }

  // ── Resolve Dispute ────────────────────────────────────────────────────────────
  static async resolveDispute(
    prisma: PrismaClient,
    openItemId: number,
    resolution: DisputeResolution,
    resolvedByUserId: number,
    notes?: string,
  ) {
    const item = await (prisma as any).openItem.findUnique({ where: { id: openItemId } });
    if (!item) throw new Error('OpenItem غير موجود');

    return prisma.$transaction(async tx => {
      const updated = await (tx as any).openItem.update({
        where: { id: openItemId },
        data:  {
          status:               resolution === 'CUSTOMER_PAYS' ? 'OPEN' : 'CLEARED',
          disputeResolvedAt:    new Date(),
          disputeResolution:    resolution,
          openAmount:           resolution === 'WRITEOFF' ? 0 : item.openAmount,
        },
      });

      // If writeoff, create a JE: DR Bad Debt / CR AR
      if (resolution === 'WRITEOFF' && Number(item.disputedAmount ?? item.openAmount) > 0) {
        const entryNumber = `WO-DISPUTE-${openItemId}-${Date.now()}`;
        await tx.journalEntry.create({
          data: {
            entryNumber,
            entryDate:   new Date().toISOString().split('T')[0],
            description: `تسوية نزاع — إعدوم ديون بحسب قرار ${notes ?? ''}`,
            status:      'posted',
            createdBy:   resolvedByUserId,
          },
        });
      }

      return updated;
    });
  }

  // ── Reverse Application ────────────────────────────────────────────────────────
  static async reverseApplication(
    prisma: PrismaClient,
    applicationId: number,
    reason: string,
    reversedByUserId: number,
  ) {
    const app = await (prisma as any).itemApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new Error('سجل التطبيق غير موجود');
    if (app.reversedAt) throw new Error('هذا التطبيق مُعكوس مسبقاً');

    return prisma.$transaction(async tx => {
      // Reverse the open amounts
      await (tx as any).openItem.update({
        where: { id: app.invoiceOpenItemId },
        data:  { openAmount: { increment: Number(app.appliedAmount) }, status: 'OPEN' },
      });
      await (tx as any).openItem.update({
        where: { id: app.paymentOpenItemId },
        data:  { openAmount: { increment: Number(app.appliedAmount) }, status: 'OPEN' },
      });

      return (tx as any).itemApplication.update({
        where: { id: applicationId },
        data:  { reversedAt: new Date(), reversedByUserId: String(reversedByUserId), reversalReason: reason },
      });
    });
  }

  // ── Aging Report ───────────────────────────────────────────────────────────────
  static async getAgingReport(
    prisma: PrismaClient,
    partyType: PartyType,
    partyId?: number,
    asOfDate: Date = new Date(),
    currency: string = 'SAR',
  ): Promise<AgingReport[]> {
    const where: any = { partyType, status: { in: ['OPEN', 'PARTIAL', 'DISPUTED'] } };
    if (partyId) where.partyId = partyId;
    if (currency !== 'ALL') where.currency = currency;

    const items = await (prisma as any).openItem.findMany({ where, take: 2000 });

    // Group by party
    const grouped = new Map<number, any[]>();
    for (const item of items) {
      if (!grouped.has(item.partyId)) grouped.set(item.partyId, []);
      grouped.get(item.partyId)!.push(item);
    }

    const results: AgingReport[] = [];
    for (const [pid, partyItems] of grouped.entries()) {
      const buckets: AgingBucket[] = [
        { bucket: '0-30',   amount: 0, currency, invoiceCount: 0 },
        { bucket: '31-60',  amount: 0, currency, invoiceCount: 0 },
        { bucket: '61-90',  amount: 0, currency, invoiceCount: 0 },
        { bucket: '91-120', amount: 0, currency, invoiceCount: 0 },
        { bucket: '120+',   amount: 0, currency, invoiceCount: 0 },
      ];

      let total    = 0;
      let disputed = 0;

      for (const item of partyItems) {
        const dueDate = new Date(item.dueDate ?? item.createdAt);
        const days    = Math.floor((asOfDate.getTime() - dueDate.getTime()) / 86400000);
        const amt     = Number(item.openAmount ?? 0);

        if (item.status === 'DISPUTED') { disputed += amt; continue; }

        const bucket = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : days <= 120 ? 3 : 4;
        buckets[bucket].amount      += amt;
        buckets[bucket].invoiceCount += 1;
        total += amt;
      }

      results.push({ partyId: pid, partyType, buckets, total, disputed });
    }

    return results;
  }
}
