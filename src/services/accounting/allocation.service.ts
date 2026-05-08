/**
 * Cost Allocation Engine (Accounting 20.4)
 * Distributes shared costs across Cost Centers using various methods.
 * Supports: Fixed %, Proportional (by revenue/headcount), and KPI-based.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AllocationMethod = 'FIXED_PERCENT' | 'PROPORTIONAL_REVENUE' | 'PROPORTIONAL_HEADCOUNT' | 'EQUAL';

export interface AllocationRule {
  id:          string;
  name:        string;
  sourceAccountId: string;       // The expense account to distribute
  method:      AllocationMethod;
  targets: {
    costCenterId: string;
    weight:       number; // For FIXED_PERCENT: percentage (sums to 100). For others: relative weight.
  }[];
}

export interface AllocationDryRun {
  rule:   AllocationRule;
  lines:  { costCenterId: string; amount: Decimal; percentage: number }[];
  totalAmount: Decimal;
}

export interface AllocationResult {
  journalEntryId: string;
  lines:          AllocationDryRun['lines'];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AllocationService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Compute how a given amount would be distributed across targets.
   * Does NOT write to the database (dry-run).
   */
  async dryRun(
    rule:        AllocationRule,
    totalAmount: Decimal,
    periodId?:   string
  ): Promise<AllocationDryRun> {
    const weights = await this.resolveWeights(rule, periodId);
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);

    const lines = weights.map(({ costCenterId, weight }) => {
      const percentage = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
      const amount     = totalAmount.mul(new Decimal(percentage / 100)).toDecimalPlaces(2);
      return { costCenterId, amount, percentage };
    });

    // Fix rounding on last line
    const allocated = lines.reduce((s, l) => s.add(l.amount), new Decimal(0));
    const diff      = totalAmount.sub(allocated);
    if (!diff.isZero() && lines.length > 0) {
      lines[lines.length - 1].amount = lines[lines.length - 1].amount.add(diff);
    }

    return { rule, lines, totalAmount };
  }

  /**
   * Execute allocation: creates a balanced journal entry distributing
   * the total account balance to cost centers.
   */
  async execute(
    rule:     AllocationRule,
    periodId: string,
    memo?:    string
  ): Promise<AllocationResult> {
    this.requirePermission('accounting:allocation:execute');
    this.requireOpenFiscalPeriod();

    // 1. Get source account balance for the period
    const balance = await this.getAccountBalance(rule.sourceAccountId, periodId);
    if (balance.isZero()) {
      throw new Error(`Account ${rule.sourceAccountId} has zero balance for this period.`);
    }

    // 2. Dry-run
    const { lines } = await this.dryRun(rule, balance, periodId);

    // 3. Create balanced journal entry
    const journalEntry = await this.db.$transaction(async (tx: any) => {
      const entry = await tx.journalEntry.create({
        data: {
          tenantId:  this.tenantId,
          bookId:    'DEFAULT',
          branchId:  this.ctx.branch?.id ?? 'default-branch',
          entryDate: new Date(),
          memo:      memo ?? `توزيع تكاليف: ${rule.name}`,
          reference: `ALLOC-${rule.id}`,
          status:    'posted',
          postedAt:  new Date(),
          postedBy:  this.ctx.user.id,
          totalDebit:  balance,
          totalCredit: balance,
          createdBy:   this.ctx.user.id,
          lines: {
            create: [
              // Credit the source account (remove the cost from it)
              {
                accountId: rule.sourceAccountId,
                debit:     new Decimal(0),
                credit:    balance,
                memo:      'مصدر التوزيع',
              },
              // Debit each cost center
              ...lines.map((l) => ({
                accountId:    rule.sourceAccountId, // Debit same account per cost center
                costCenterId: l.costCenterId,
                debit:        l.amount,
                credit:       new Decimal(0),
                memo:         `توزيع ${l.percentage.toFixed(1)}%`,
              })),
            ],
          },
        },
      });

      return entry;
    });

    eventBus.afterCommit('accounting.allocation.executed', {
      ruleId:         rule.id,
      journalEntryId: journalEntry.id,
      tenantId:       this.tenantId,
      totalAmount:    balance.toString(),
    });

    return {
      journalEntryId: journalEntry.id,
      lines,
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async resolveWeights(
    rule:     AllocationRule,
    periodId?: string
  ): Promise<{ costCenterId: string; weight: number }[]> {
    if (rule.method === 'FIXED_PERCENT' || rule.method === 'EQUAL') {
      return rule.targets.map((t) => ({
        costCenterId: t.costCenterId,
        weight:       rule.method === 'EQUAL' ? 1 : t.weight,
      }));
    }

    if (rule.method === 'PROPORTIONAL_REVENUE') {
      // Use sales revenue per cost center as weight
      const revenues = await Promise.all(
        rule.targets.map(async (t) => {
          const result = await (this.db as any).journalLine.aggregate({
            where: {
              costCenterId: t.costCenterId,
              journalEntry: { tenantId: this.tenantId, status: 'posted' },
              // Revenue accounts: Credit > Debit
            },
            _sum: { credit: true, debit: true },
          });
          const revenue = Number(result._sum?.credit ?? 0) - Number(result._sum?.debit ?? 0);
          return { costCenterId: t.costCenterId, weight: Math.max(0, revenue) };
        })
      );
      return revenues;
    }

    if (rule.method === 'PROPORTIONAL_HEADCOUNT') {
      // Use active employee count per cost center
      const counts = await Promise.all(
        rule.targets.map(async (t) => {
          const count = await (this.db as any).employee.count({
            where: {
              tenantId:     this.tenantId,
              costCenterId: t.costCenterId,
              status:       'active',
            },
          }).catch(() => 0);
          return { costCenterId: t.costCenterId, weight: count };
        })
      );
      return counts;
    }

    return rule.targets.map((t) => ({ costCenterId: t.costCenterId, weight: t.weight }));
  }

  private async getAccountBalance(
    accountId: string,
    periodId:  string
  ): Promise<Decimal> {
    const result = await (this.db as any).journalLine.aggregate({
      where: {
        accountId,
        journalEntry: { tenantId: this.tenantId, status: 'posted' },
      },
      _sum: { debit: true, credit: true },
    }).catch(() => ({ _sum: { debit: 0, credit: 0 } }));

    const debit  = new Decimal(result._sum?.debit  ?? 0);
    const credit = new Decimal(result._sum?.credit ?? 0);
    return debit.sub(credit).abs();
  }
}
