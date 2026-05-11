/**
 * ECL Engine — Expected Credit Loss (IFRS 9 / IAS 39)
 * ══════════════════════════════════════════════════════
 * Simplified ECL provisioning for Accounts Receivable using
 * the "Simplified Approach" (IFRS 9 §5.5.15) — provision matrix based on aging.
 *
 * Stages (IFRS 9 §5.5.3):
 *   Stage 1: Current → 30 days   → 12-month ECL (typically ~0.5%)
 *   Stage 2: 31–90 days           → Lifetime ECL (~5–15%)
 *   Stage 3: 91–180 days          → Lifetime ECL (~30–50%)
 *   Stage 4: 181–365 days         → Lifetime ECL (~75%)
 *   Stage 5: > 365 days (WO)      → 100%
 *
 * The provision rates are configurable per tenant (stored in settings).
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ecl-engine' });

export interface ECLBucket {
  label: string;
  minDays: number;
  maxDays: number;
  provisionRate: number;   // 0.00–1.00
  stage: 1 | 2 | 3 | 4 | 5;
}

export const DEFAULT_ECL_MATRIX: ECLBucket[] = [
  { label: 'Current (0–30 days)',    minDays: 0,   maxDays: 30,  provisionRate: 0.005, stage: 1 },
  { label: '31–90 days',             minDays: 31,  maxDays: 90,  provisionRate: 0.05,  stage: 2 },
  { label: '91–180 days',            minDays: 91,  maxDays: 180, provisionRate: 0.30,  stage: 3 },
  { label: '181–365 days',           minDays: 181, maxDays: 365, provisionRate: 0.75,  stage: 4 },
  { label: '> 365 days (Write-Off)', minDays: 366, maxDays: Infinity, provisionRate: 1.00, stage: 5 },
];

export interface ECLInvoiceRow {
  invoiceId: number;
  invoiceNo: string;
  customerId: number;
  customerName: string;
  currency: string;
  invoiceDate: Date;
  dueDate: Date;
  outstanding: number;
  agingDays: number;
  bucket: string;
  stage: 1 | 2 | 3 | 4 | 5;
  provisionRate: number;
  eclAmount: number;
}

export interface ECLReport {
  asOfDate: Date;
  totalOutstanding: number;
  totalECL: number;
  weightedAverageRate: number;
  byBucket: Array<{
    bucket: string;
    stage: number;
    count: number;
    outstanding: number;
    provisionRate: number;
    eclAmount: number;
  }>;
  byCustomer: Array<{
    customerId: number;
    customerName: string;
    outstanding: number;
    eclAmount: number;
    worstStage: number;
  }>;
  details: ECLInvoiceRow[];
  journalEntry: {
    debit:  Array<{ account: string; amount: number }>;
    credit: Array<{ account: string; amount: number }>;
  };
}

export class ECLEngine {

  /** Run ECL calculation for all open AR invoices */
  static async calculate(
    asOfDate: Date = new Date(),
    matrix: ECLBucket[] = DEFAULT_ECL_MATRIX,
  ): Promise<ECLReport> {

    // Fetch all open/partial sales invoices
    const invoices = await prisma.salesInvoice.findMany({
      where: {
        deletedAt: null,
        status:    { in: ['OPEN', 'PARTIAL', 'open', 'partial', 'POSTED'] },
      },
      select: {
      id: true, invoiceNo: true, date: true,
        remaining: true, currencyId: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
      },
      take: 5000,
    }).catch(() => [] as any[]);

    const rows: ECLInvoiceRow[] = [];
    const bucketMap: Record<string, { count: number; outstanding: number; eclAmount: number; stage: number; rate: number }> = {};
    const customerMap: Record<number, { name: string; outstanding: number; eclAmount: number; worstStage: number }> = {};

    for (const inv of invoices as any[]) {
      const outstanding = Math.max(0, Number(inv.remaining || 0));
      if (outstanding <= 0) continue;

      // Use invoice date as aging proxy (no explicit dueDate in SalesInvoice)
      const dueDate   = new Date(inv.date);
      const agingDays = Math.max(0, Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Find bucket
      const bucket = matrix.find(b => agingDays >= b.minDays && agingDays <= b.maxDays)
        ?? matrix[matrix.length - 1];

      const eclAmount = Math.round(outstanding * bucket.provisionRate * 100) / 100;

      rows.push({
        invoiceId:    inv.id,
        invoiceNo:    inv.invoiceNo || `INV-${inv.id}`,
        customerId:   inv.customerId || 0,
        customerName: inv.customer?.name || 'غير معروف',
        currency:     inv.currency || 'SAR',
        invoiceDate:  new Date(inv.date),
        dueDate,
        outstanding:  Math.round(outstanding * 100) / 100,
        agingDays,
        bucket:       bucket.label,
        stage:        bucket.stage,
        provisionRate: bucket.provisionRate,
        eclAmount,
      });

      // Aggregate by bucket
      if (!bucketMap[bucket.label]) {
        bucketMap[bucket.label] = { count: 0, outstanding: 0, eclAmount: 0, stage: bucket.stage, rate: bucket.provisionRate };
      }
      bucketMap[bucket.label].count++;
      bucketMap[bucket.label].outstanding += outstanding;
      bucketMap[bucket.label].eclAmount   += eclAmount;

      // Aggregate by customer
      const cid = inv.customerId || 0;
      if (!customerMap[cid]) {
        customerMap[cid] = { name: inv.customer?.name || 'غير معروف', outstanding: 0, eclAmount: 0, worstStage: 1 };
      }
      customerMap[cid].outstanding += outstanding;
      customerMap[cid].eclAmount   += eclAmount;
      if (bucket.stage > customerMap[cid].worstStage) {
        customerMap[cid].worstStage = bucket.stage;
      }
    }

    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
    const totalECL         = rows.reduce((s, r) => s + r.eclAmount, 0);
    const wavgRate         = totalOutstanding > 0 ? totalECL / totalOutstanding : 0;

    log.info(`ECL: ${rows.length} invoices, outstanding=${totalOutstanding.toFixed(2)}, ECL=${totalECL.toFixed(2)}`);

    // Sort buckets by minDays
    const byBucket = Object.entries(bucketMap)
      .map(([label, v]) => ({ bucket: label, ...v }))
      .sort((a, b) => a.stage - b.stage);

    const byCustomer = Object.entries(customerMap)
      .map(([cidStr, v]) => ({ customerId: parseInt(cidStr), customerName: v.name, outstanding: Math.round(v.outstanding * 100) / 100, eclAmount: Math.round(v.eclAmount * 100) / 100, worstStage: v.worstStage }))
      .sort((a, b) => b.eclAmount - a.eclAmount)
      .slice(0, 100);

    const eclRounded = Math.round(totalECL * 100) / 100;

    return {
      asOfDate,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalECL:         eclRounded,
      weightedAverageRate: Math.round(wavgRate * 10000) / 10000,
      byBucket: byBucket.map(b => ({
        bucket:       b.bucket,
        stage:        b.stage,
        count:        b.count,
        outstanding:  Math.round(b.outstanding * 100) / 100,
        provisionRate: b.rate,
        eclAmount:    Math.round(b.eclAmount * 100) / 100,
      })),
      byCustomer,
      details: rows.sort((a, b) => b.outstanding - a.outstanding),
      // Journal: DR Bad Debt Expense, CR Allowance for Doubtful Accounts
      journalEntry: {
        debit:  [{ account: 'مصروف الديون المشكوك في تحصيلها (Bad Debt Expense)', amount: eclRounded }],
        credit: [{ account: 'مخصص الديون المشكوك في تحصيلها (Allowance for Doubtful Accounts)', amount: eclRounded }],
      },
    };
  }

  /** Classify a single invoice for quick check */
  static classifyInvoice(outstandingAmount: number, agingDays: number, matrix = DEFAULT_ECL_MATRIX): {
    bucket: string; stage: number; provisionRate: number; eclAmount: number;
  } {
    const b = matrix.find(bkt => agingDays >= bkt.minDays && agingDays <= bkt.maxDays) ?? matrix[matrix.length - 1];
    return {
      bucket:       b.label,
      stage:        b.stage,
      provisionRate: b.provisionRate,
      eclAmount:    Math.round(outstandingAmount * b.provisionRate * 100) / 100,
    };
  }
}
