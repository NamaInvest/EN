/**
 * Credit Management Service (AR Module 21.1)
 * Handles credit limits, credit scoring, and order holds.
 * Implements IFRS 9 aging buckets for risk classification.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgingBucket = '0-30' | '31-60' | '61-90' | '91-120' | '120+';

export interface CreditDecision {
  approved:         boolean;
  reason:           string;
  availableCredit:  number;
  currentExposure:  number;
  creditLimit:      number;
}

export interface CustomerAgingReport {
  customerId:   string;
  customerName: string;
  buckets: Record<AgingBucket, number>;
  totalOutstanding: number;
  creditScore:  number; // 300–850
  riskClass:    'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface HoldDecision {
  onHold:  boolean;
  reason?: string;
}

// ─── Credit Score Rules ───────────────────────────────────────────────────────

function calculateCreditScore(
  paymentHistory: number,   // 0-100: % invoices paid on time
  daysLate:       number,   // average days late
  outstandingRatio: number  // outstanding / credit limit
): number {
  // Base: 500
  let score = 500;
  // Payment history (weight: 35%)
  score += (paymentHistory - 50) * 1.5;
  // Days late (weight: 30%) — penalty
  score -= Math.min(daysLate * 2, 120);
  // Utilization (weight: 25%) — high utilization = lower score
  score -= Math.min(outstandingRatio * 100, 100);
  return Math.max(300, Math.min(850, Math.round(score)));
}

function scoreToRiskClass(score: number): CustomerAgingReport['riskClass'] {
  if (score >= 700) return 'LOW';
  if (score >= 580) return 'MEDIUM';
  if (score >= 450) return 'HIGH';
  return 'CRITICAL';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CreditManagementService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Check if a customer can proceed with a new transaction.
   * Returns a CreditDecision including available headroom.
   */
  async checkCreditLimit(
    customerId: string,
    amount:     number
  ): Promise<CreditDecision> {
    const customer = await this.db.customer.findFirstOrThrow({
      where: { id: customerId as any, tenantId: this.tenantId },
    });

    const creditLimit = Number((customer as any).creditLimit ?? 0);

    // Calculate current exposure: sum of open (unpaid) invoice balances
    const openInvoices = await (this.db as any).salesInvoice.findMany({
      where: {
        customerId,
        tenantId: this.tenantId,
        status: { in: ['posted', 'partial'] },
      },
      select: { totalAmount: true, paidAmount: true },
    });

    const currentExposure = openInvoices.reduce(
      (sum: number, inv: any) =>
        sum + Number(inv.totalAmount ?? 0) - Number(inv.paidAmount ?? 0),
      0
    );

    const availableCredit = Math.max(0, creditLimit - currentExposure);

    if (creditLimit === 0) {
      // No limit set → treat as unlimited
      return { approved: true, reason: 'لا يوجد حد ائتماني محدد', availableCredit: Infinity, currentExposure, creditLimit };
    }

    if (currentExposure + amount > creditLimit) {
      return {
        approved:        false,
        reason:          `تجاوز الحد الائتماني. المتاح: ${availableCredit.toFixed(2)} — المطلوب: ${amount.toFixed(2)}`,
        availableCredit,
        currentExposure,
        creditLimit,
      };
    }

    return { approved: true, reason: 'ضمن الحد الائتماني', availableCredit, currentExposure, creditLimit };
  }

  /**
   * Calculate a credit score for a customer (300–850).
   */
  async calculateCreditScore(customerId: string): Promise<number> {
    const cutoff30  = new Date(Date.now() - 30  * 86400000);
    const cutoff365 = new Date(Date.now() - 365 * 86400000);

    const invoices = await (this.db as any).salesInvoice.findMany({
      where: {
        customerId,
        tenantId: this.tenantId,
        invoiceDate: { gte: cutoff365 },
      },
      select: { totalAmount: true, paidAmount: true, dueDate: true, lastPaymentDate: true },
    });

    if (invoices.length === 0) return 600; // neutral score for new customers

    const paid     = invoices.filter((i: any) => Number(i.paidAmount) >= Number(i.totalAmount));
    const onTime   = paid.filter((i: any) => !i.lastPaymentDate || new Date(i.lastPaymentDate) <= new Date(i.dueDate));
    const history  = paid.length > 0 ? (onTime.length / paid.length) * 100 : 0;

    const daysLate = paid
      .filter((i: any) => i.lastPaymentDate && new Date(i.lastPaymentDate) > new Date(i.dueDate))
      .reduce((sum: number, i: any) => {
        const late = Math.max(0, (new Date(i.lastPaymentDate).getTime() - new Date(i.dueDate).getTime()) / 86400000);
        return sum + late;
      }, 0) / Math.max(paid.length, 1);

    const customer = await this.db.customer.findFirst({
      where: { id: customerId as any, tenantId: this.tenantId },
    });
    const creditLimit = Number((customer as any).creditLimit ?? 1);

    const outstanding = invoices.reduce(
      (sum: number, i: any) => sum + Math.max(0, Number(i.totalAmount) - Number(i.paidAmount ?? 0)),
      0
    );
    const ratio = creditLimit > 0 ? outstanding / creditLimit : 0;

    return calculateCreditScore(history, daysLate, ratio);
  }

  /**
   * Determine if an order should be held based on credit status.
   */
  async holdOrderIfOverLimit(
    customerId: string,
    amount:     number
  ): Promise<HoldDecision> {
    const decision = await this.checkCreditLimit(customerId, amount);
    if (!decision.approved) {
      return { onHold: true, reason: decision.reason };
    }
    return { onHold: false };
  }

  /**
   * Generate an Aging Report for all customers (AR Aging).
   * Groups outstanding invoices into 0-30, 31-60, 61-90, 91-120, 120+ buckets.
   */
  async generateAgingReport(): Promise<CustomerAgingReport[]> {
    const today = new Date();

    const openInvoices = await (this.db as any).salesInvoice.findMany({
      where: {
        tenantId: this.tenantId,
        status:   { in: ['posted', 'partial'] },
      },
      include: { customer: { select: { id: true, name: true, creditLimit: true } } },
    });

    // Group by customer
    const byCustomer = new Map<string, { customer: any; invoices: any[] }>();
    for (const inv of openInvoices) {
      if (!byCustomer.has(inv.customerId)) {
        byCustomer.set(inv.customerId, { customer: inv.customer, invoices: [] });
      }
      byCustomer.get(inv.customerId)!.invoices.push(inv);
    }

    const reports: CustomerAgingReport[] = [];

    for (const [customerId, { customer, invoices }] of byCustomer) {
      const buckets: Record<AgingBucket, number> = {
        '0-30':   0,
        '31-60':  0,
        '61-90':  0,
        '91-120': 0,
        '120+':   0,
      };

      let totalOutstanding = 0;

      for (const inv of invoices) {
        const outstanding = Number(inv.totalAmount ?? 0) - Number(inv.paidAmount ?? 0);
        if (outstanding <= 0) continue;

        const daysOverdue = Math.max(0,
          Math.floor((today.getTime() - new Date(inv.dueDate ?? inv.invoiceDate).getTime()) / 86400000)
        );

        if      (daysOverdue <= 30)  buckets['0-30']   += outstanding;
        else if (daysOverdue <= 60)  buckets['31-60']  += outstanding;
        else if (daysOverdue <= 90)  buckets['61-90']  += outstanding;
        else if (daysOverdue <= 120) buckets['91-120'] += outstanding;
        else                         buckets['120+']   += outstanding;

        totalOutstanding += outstanding;
      }

      const creditScore = await this.calculateCreditScore(customerId);
      const riskClass   = scoreToRiskClass(creditScore);

      reports.push({
        customerId,
        customerName:    customer?.name ?? 'غير معروف',
        buckets,
        totalOutstanding,
        creditScore,
        riskClass,
      });
    }

    return reports.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }
}
