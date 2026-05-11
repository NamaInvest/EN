/**
 * Commitments Register Engine (G7)
 * ══════════════════════════════════════════════════════════════════════════════
 * Tracks unrecognized commitments per IAS 37 and IFRS disclosure requirements.
 *
 * Covers:
 *   - Open Purchase Orders (outstanding amount not yet invoiced)
 *   - Contractual commitments (service contracts, leases)
 *   - Capital commitments (CAPEX authorized but not spent)
 *   - Operating lease commitments (IFRS 16 short-term exemptions)
 *
 * IAS 37.86: Entities shall disclose commitments not recognized in financial statements.
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'commitments-register' });

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommitmentType =
  | 'PURCHASE_ORDER'
  | 'SERVICE_CONTRACT'
  | 'CAPITAL_COMMITMENT'
  | 'OPERATING_LEASE'
  | 'FINANCIAL_GUARANTEE'
  | 'LEGAL_CONTINGENCY';

export type CommitmentStatus = 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';

export interface CommitmentItem {
  id:              string | number;
  type:            CommitmentType;
  description:     string;
  counterparty?:   string;
  currency:        string;
  originalAmount:  number;
  fulfilledAmount: number;
  outstandingAmount: number;
  fulfilledPct:    number;
  startDate?:      string;
  endDate?:        string;
  dueDate?:        string;
  status:          CommitmentStatus;
  /** maturity bucket per IFRS 7 */
  maturityBucket:  'WITHIN_1_YEAR' | '1_TO_5_YEARS' | 'OVER_5_YEARS';
  sourceRef?:      string;   // e.g. "PO-2026-001"
}

export interface CommitmentsRegister {
  asOf:        string;
  tenantId:    string;
  items:       CommitmentItem[];
  /** Summary by type */
  summary:     Record<CommitmentType, { count: number; outstanding: number }>;
  /** IAS 37 disclosure buckets */
  disclosure:  {
    within1Year:  number;
    from1To5Years: number;
    over5Years:   number;
    total:        number;
  };
  generatedAt: Date;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class CommitmentsRegisterEngine {

  /**
   * Classify a date into IFRS 7 maturity bucket relative to asOf.
   */
  static maturityBucket(
    endDate: Date | null | undefined,
    asOf: Date,
  ): CommitmentItem['maturityBucket'] {
    if (!endDate) return 'WITHIN_1_YEAR';
    const diffMs    = endDate.getTime() - asOf.getTime();
    const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
    if (diffYears <= 1)  return 'WITHIN_1_YEAR';
    if (diffYears <= 5)  return '1_TO_5_YEARS';
    return 'OVER_5_YEARS';
  }

  /**
   * Build the full commitments register as of a given date.
   */
  static async generate(
    tenantId: string,
    asOf?: Date,
  ): Promise<CommitmentsRegister> {
    const asOfDate = asOf ?? new Date();
    const items: CommitmentItem[] = [];

    // ── 1. Open Purchase Orders ───────────────────────────────────────────────
    const openPOs = await (prisma as any).purchaseOrder?.findMany?.({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PARTIALLY_RECEIVED', 'approved', 'partial'] },
      },
      include: {
        vendor: { select: { name: true, nameAr: true } },
        details: { select: { quantity: true, unitPrice: true, receivedQty: true } },
      },
    }).catch(() => []) ?? [];

    for (const po of openPOs) {
      const original  = (po.details ?? []).reduce((s: number, d: any) =>
        s + Number(d.quantity ?? 0) * Number(d.unitPrice ?? 0), 0);
      const fulfilled = (po.details ?? []).reduce((s: number, d: any) =>
        s + Number(d.receivedQty ?? 0) * Number(d.unitPrice ?? 0), 0);
      const outstanding = Math.max(0, original - fulfilled);
      if (outstanding <= 0) continue;

      items.push({
        id:               po.id,
        type:             'PURCHASE_ORDER',
        description:      `PO #${po.poNumber ?? po.id}`,
        counterparty:     po.vendor?.nameAr ?? po.vendor?.name ?? po.vendorName,
        currency:         po.currency ?? 'SAR',
        originalAmount:   Math.round(original * 100) / 100,
        fulfilledAmount:  Math.round(fulfilled * 100) / 100,
        outstandingAmount: Math.round(outstanding * 100) / 100,
        fulfilledPct:     original > 0 ? Math.round((fulfilled / original) * 100) : 0,
        startDate:        po.orderDate?.toISOString?.()?.split('T')[0],
        dueDate:          po.expectedDelivery?.toISOString?.()?.split('T')[0],
        status:           fulfilled > 0 ? 'PARTIALLY_FULFILLED' : 'OPEN',
        maturityBucket:   this.maturityBucket(po.expectedDelivery, asOfDate),
        sourceRef:        po.poNumber ?? `PO-${po.id}`,
      });
    }

    // ── 2. Service Contracts ──────────────────────────────────────────────────
    const serviceContracts = await (prisma as any).serviceContract?.findMany?.({
      where: { tenantId, status: { in: ['ACTIVE', 'active'] } },
    }).catch(() => []) ?? [];

    for (const sc of serviceContracts) {
      const endDate    = sc.endDate ? new Date(sc.endDate) : null;
      const outstanding = Number(sc.remainingValue ?? sc.totalValue ?? 0);
      if (outstanding <= 0) continue;

      items.push({
        id:               sc.id,
        type:             'SERVICE_CONTRACT',
        description:      sc.description ?? sc.name ?? `Service Contract #${sc.id}`,
        counterparty:     sc.vendorName ?? sc.customerName,
        currency:         sc.currency ?? 'SAR',
        originalAmount:   Number(sc.totalValue ?? 0),
        fulfilledAmount:  Number(sc.invoicedAmount ?? 0),
        outstandingAmount: outstanding,
        fulfilledPct:     sc.totalValue > 0
          ? Math.round((Number(sc.invoicedAmount ?? 0) / Number(sc.totalValue)) * 100) : 0,
        startDate:        sc.startDate?.toISOString?.()?.split('T')[0],
        endDate:          sc.endDate?.toISOString?.()?.split('T')[0],
        status:           'OPEN',
        maturityBucket:   this.maturityBucket(endDate, asOfDate),
        sourceRef:        sc.contractNumber ?? `SC-${sc.id}`,
      });
    }

    // ── 3. Capital Commitments (CAPEX authorized, not yet spent) ─────────────
    const capexBudgets = await (prisma as any).budgetLine?.findMany?.({
      where: {
        budget: { tenantId },
        account: { code: { startsWith: '14' } },  // Fixed assets range
      },
      include: { account: { select: { code: true, nameAr: true, name: true } } },
    }).catch(() => []) ?? [];

    for (const bl of capexBudgets) {
      const authorized = Number(bl.allocatedAmount ?? 0);
      const spent      = Number(bl.spentAmount ?? 0);
      const outstanding = Math.max(0, authorized - spent);
      if (outstanding <= 0) continue;

      items.push({
        id:               `CAPEX-${bl.id}`,
        type:             'CAPITAL_COMMITMENT',
        description:      `CAPEX: ${bl.account?.nameAr ?? bl.account?.name ?? bl.account?.code}`,
        currency:         'SAR',
        originalAmount:   authorized,
        fulfilledAmount:  spent,
        outstandingAmount: outstanding,
        fulfilledPct:     authorized > 0 ? Math.round((spent / authorized) * 100) : 0,
        status:           spent > 0 ? 'PARTIALLY_FULFILLED' : 'OPEN',
        maturityBucket:   'WITHIN_1_YEAR',
        sourceRef:        bl.account?.code,
      });
    }

    // ── 4. Operating Lease Commitments (IFRS 16 short-term exemptions) ───────
    const shortTermLeases = await (prisma as any).ifrsLeaseContract?.findMany?.({
      where: {
        tenantId,
        exemption: 'SHORT_TERM',
        status: { in: ['ACTIVE', 'active'] },
      },
    }).catch(() => []) ?? [];

    for (const lease of shortTermLeases) {
      const endDate    = lease.endDate ? new Date(lease.endDate) : null;
      const outstanding = Number(lease.remainingPayments ?? lease.paymentAmount ?? 0);
      if (outstanding <= 0) continue;

      items.push({
        id:               `LEASE-${lease.id}`,
        type:             'OPERATING_LEASE',
        description:      lease.assetDescription ?? `Short-term Lease #${lease.id}`,
        currency:         lease.currency ?? 'SAR',
        originalAmount:   Number(lease.totalPayments ?? 0),
        fulfilledAmount:  Number(lease.paidAmount ?? 0),
        outstandingAmount: outstanding,
        fulfilledPct:     0,
        endDate:          lease.endDate?.toISOString?.()?.split('T')[0],
        status:           'OPEN',
        maturityBucket:   this.maturityBucket(endDate, asOfDate),
        sourceRef:        `LEASE-${lease.id}`,
      });
    }

    // ── Build Summary ────────────────────────────────────────────────────────
    const summaryTypes: CommitmentType[] = [
      'PURCHASE_ORDER', 'SERVICE_CONTRACT', 'CAPITAL_COMMITMENT',
      'OPERATING_LEASE', 'FINANCIAL_GUARANTEE', 'LEGAL_CONTINGENCY',
    ];
    const summary = Object.fromEntries(
      summaryTypes.map(t => [t, {
        count:       items.filter(i => i.type === t).length,
        outstanding: items.filter(i => i.type === t).reduce((s, i) => s + i.outstandingAmount, 0),
      }])
    ) as Record<CommitmentType, { count: number; outstanding: number }>;

    const disclosure = {
      within1Year:   items.filter(i => i.maturityBucket === 'WITHIN_1_YEAR')
                         .reduce((s, i) => s + i.outstandingAmount, 0),
      from1To5Years: items.filter(i => i.maturityBucket === '1_TO_5_YEARS')
                         .reduce((s, i) => s + i.outstandingAmount, 0),
      over5Years:    items.filter(i => i.maturityBucket === 'OVER_5_YEARS')
                         .reduce((s, i) => s + i.outstandingAmount, 0),
      total:         items.reduce((s, i) => s + i.outstandingAmount, 0),
    };

    log.info('Commitments register generated', { tenantId, items: items.length, total: disclosure.total });

    return {
      asOf:        asOfDate.toISOString().split('T')[0],
      tenantId,
      items:       items.sort((a, b) => b.outstandingAmount - a.outstandingAmount),
      summary,
      disclosure,
      generatedAt: new Date(),
    };
  }
}
