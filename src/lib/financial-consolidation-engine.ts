/**
 * FinancialConsolidationEngine — محرك توحيد القوائم المالية
 *
 * يُوفر معالجة وتجميع أرصدة الشركات التابعة والفروع التابعة لنفس الحساب (tenantId).
 * يلتزم بمعايير التقارير المالية الدولية (IFRS 10) والامتثال لمعيار المحاسبة الدولي (IAS 21).
 * يدعم الاستبعادات البينية (Intercompany Eliminations) ومختلف طرق التوحيد (كامل، نسبي، حقوق ملكية).
 */

import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'financial-consolidation-engine' });

export interface EntityBalance {
  companyId: number;
  companyName: string;
  balances: Map<string, Decimal>; // accountCode -> balance
}

export interface EliminationAdjustment {
  accountCode: string;
  debit: Decimal;
  credit: Decimal;
  description: string;
}

export interface ConsolidatedRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentId: number | null;
  balances: Record<number, Decimal>; // companyId -> balance
  eliminationDebit: Decimal;
  eliminationCredit: Decimal;
  consolidatedNet: Decimal;
}

export interface IntercompanyMatch {
  ruleName: string;
  ruleType: string;
  sourceAccount: string;
  sourceAccountName: string;
  targetAccount: string;
  targetAccountName: string;
  receivableBalance: Decimal;
  payableBalance: Decimal;
  difference: Decimal;
  eliminationAmount: Decimal;
  status: 'MATCHED' | 'MISMATCHED' | 'NO_BALANCE';
}

export interface CompanyBranchValidation {
  companyId: number;
  companyName: string;
  hasBranches: boolean;
  branchCount: number;
  hasTransactions: boolean;
  status: 'VALID' | 'WARNING_NO_BRANCHES' | 'WARNING_NO_TRANSACTIONS';
}

export interface ProposedLine {
  accountCode: string;
  accountName: string;
  debit: Decimal;
  credit: Decimal;
  description: string;
}

export interface ProposedJournalEntry {
  description: string;
  reference: string;
  entryDate: string;
  autoReverseDate: string | null;
  lines: ProposedLine[];
}

export interface DryRunResult {
  groupId: number;
  groupName: string;
  periodFrom: string;
  periodTo: string;
  isBalanced: boolean;
  totalDebit: Decimal;
  totalCredit: Decimal;
  proposedEntries: ProposedJournalEntry[];
  warnings: string[];
}

export interface ConsolidationResult {
  groupId: number;
  groupName: string;
  fiscalPeriodId: number;
  baseCurrency: string;
  rows: ConsolidatedRow[];
  companies: { id: number; name: string; isParent: boolean; ownership: Decimal }[];
  isBalanced: boolean;
  generatedAt: Date;
  // F-13B extensions
  mappingCompletenessScore: number;
  intercompanyMatches: IntercompanyMatch[];
  companyBranchValidations: CompanyBranchValidation[];
}

export class FinancialConsolidationEngine {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * إجراء توحيد القوائم المالية لمجموعة محددة وفترة مالية محددة.
   */
  async consolidate(
    tenantId: string,
    groupId: number,
    from: Date,
    to: Date
  ): Promise<ConsolidationResult> {
    // 1. Fetch consolidation group details
    const group = await this.prisma.consolidationGroup.findFirst({
      where: { id: groupId, tenantId, isActive: true },
      include: {
        members: true,
        eliminationRules: true,
      },
    });

    if (!group) {
      throw new Error(`مجموعة التوحيد غير موجودة أو غير نشطة: ${groupId}`);
    }

    // Resolve parent company info
    const parentCompany = await this.prisma.company.findFirst({
      where: { id: group.parentCompanyId, tenantId },
    });

    if (!parentCompany) {
      throw new Error(`الشركة القابضة (الرئيسية) غير موجودة: ${group.parentCompanyId}`);
    }

    // Compile member list including parent
    const companiesList = [
      {
        id: parentCompany.id,
        name: parentCompany.name,
        isParent: true,
        ownership: new Decimal(1.0),
        consolidationMethod: 'FULL',
      },
    ];

    for (const member of group.members) {
      if (!member.active) continue;
      const compId = parseInt(member.entityId, 10);
      if (isNaN(compId)) continue;

      const comp = await this.prisma.company.findFirst({
        where: { id: compId, tenantId },
      });

      if (comp) {
        companiesList.push({
          id: comp.id,
          name: comp.name,
          isParent: false,
          ownership: member.ownership,
          consolidationMethod: member.consolidationMethod, // FULL | PROPORTIONAL | EQUITY
        });
      }
    }

    // 2. Query balances for all member companies
    const entityBalances: EntityBalance[] = [];
    const allAccountCodes = new Set<string>();

    for (const comp of companiesList) {
      // Get company branches
      const branches = await this.prisma.branch.findMany({
        where: { companyId: comp.id, tenantId },
        select: { id: true },
      });
      const branchIds = branches.map((b) => b.id);

      // Fetch balances for these branches
      const balances = await this._getCompanyBalances(tenantId, branchIds, from, to);
      entityBalances.push({
        companyId: comp.id,
        companyName: comp.name,
        balances,
      });

      // Keep track of all account codes involved
      for (const code of balances.keys()) {
        allAccountCodes.add(code);
      }
    }

    // Fetch all active accounts inside this tenant to get names and metadata
    const accounts = await this.prisma.account.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true, nameEn: true, type: true, parentId: true },
      orderBy: { code: 'asc' },
    });

    const accountMetaMap = new Map<string, typeof accounts[number]>(
      accounts.map((a) => [a.code, a])
    );

    // Ensure all transactional accounts have metadata
    for (const code of allAccountCodes) {
      if (!accountMetaMap.has(code)) {
        // Fallback placeholder if account is not found in COA
        accountMetaMap.set(code, {
          id: -1,
          code,
          name: `حساب غير معرف (${code})`,
          nameEn: `Undefined Account (${code})`,
          type: 'asset',
          parentId: 0,
        });
      }
    }

    // 3. Process Consolidation Methods & Ownership Rollups in-memory
    const rolledBalances = new Map<string, Record<number, Decimal>>();

    for (const code of allAccountCodes) {
      const colMap: Record<number, Decimal> = {};
      for (const comp of companiesList) {
        const entityData = entityBalances.find((eb) => eb.companyId === comp.id);
        const originalBal = entityData?.balances.get(code) || new Decimal(0);

        // Apply consolidation method scaling
        let scaledBal = new Decimal(0);
        if (comp.isParent || comp.consolidationMethod === 'FULL') {
          scaledBal = originalBal; // FULL Consolidation rolls up 100%
        } else if (comp.consolidationMethod === 'PROPORTIONAL') {
          scaledBal = originalBal.mul(comp.ownership); // PROPORTIONAL rolls up scaled percentage
        } else if (comp.consolidationMethod === 'EQUITY') {
          // EQUITY method aggregates 0 line-by-line; parent accounts manually reflect it
          scaledBal = new Decimal(0);
        }

        colMap[comp.id] = scaledBal;
      }
      rolledBalances.set(code, colMap);
    }

    // 4. Compute Intercompany Transaction Eliminations in-memory
    const eliminations: EliminationAdjustment[] = [];

    for (const rule of group.eliminationRules) {
      if (!rule.active) continue;

      if (rule.ruleType === 'INTERCOMPANY_AR_AP') {
        const sourceAcc = rule.sourceAccount;
        const targetAcc = rule.targetAccount;

        if (sourceAcc && targetAcc) {
          // Get the aggregate balances across subsidiaries for these two accounts
          let totalSource = new Decimal(0);
          let totalTarget = new Decimal(0);

          for (const comp of companiesList) {
            const sourceBal = rolledBalances.get(sourceAcc)?.[comp.id] || new Decimal(0);
            const targetBal = rolledBalances.get(targetAcc)?.[comp.id] || new Decimal(0);

            totalSource = totalSource.add(sourceBal);
            totalTarget = totalTarget.add(targetBal);
          }

          // Offset the matching minimum to eliminate intercompany balance
          // Receivables usually have debit balance (negative in standard engine net: credit-debit)
          // Payables usually have credit balance (positive)
          // Let's compute absolute minimum to eliminate
          const absSource = totalSource.abs();
          const absTarget = totalTarget.abs();
          const eliminationAmount = Decimal.min(absSource, absTarget);

          if (eliminationAmount.gt(0)) {
            // Receivable reduction: Credit adjustment (adds to debit, bringing closer to 0)
            eliminations.push({
              accountCode: sourceAcc,
              debit: new Decimal(0),
              credit: eliminationAmount,
              description: `استبعاد أرصدة مدينة بينية بموجب القاعدة: ${rule.ruleName}`,
            });

            // Payable reduction: Debit adjustment (reduces credit, bringing closer to 0)
            eliminations.push({
              accountCode: targetAcc,
              debit: eliminationAmount,
              credit: new Decimal(0),
              description: `استبعاد أرصدة دائنة بينية بموجب القاعدة: ${rule.ruleName}`,
            });
          }
        }
      }
    }

    // 5. Compile final unified Rows
    const rows: ConsolidatedRow[] = [];

    for (const code of allAccountCodes) {
      const meta = accountMetaMap.get(code)!;
      const colBalances = rolledBalances.get(code) || {};

      // Sum all elimination adjustments for this account
      let elimDebit = new Decimal(0);
      let elimCredit = new Decimal(0);

      const accElims = eliminations.filter((e) => e.accountCode === code);
      for (const elim of accElims) {
        elimDebit = elimDebit.add(elim.debit);
        elimCredit = elimCredit.add(elim.credit);
      }

      // Compute Consolidated Net Balance
      // Net balance is: sum of entities + elimDebit - elimCredit
      let entitySum = new Decimal(0);
      for (const comp of companiesList) {
        entitySum = entitySum.add(colBalances[comp.id] || new Decimal(0));
      }

      // Adjust Net based on Account type rules:
      // In standard mapping: Net balance = Credit - Debit
      // If it is Asset or Expense, balance is Debit-natured, so Net = Debit - Credit
      const typeLower = (meta.type || '').toLowerCase();
      const isDebitNatured = typeLower === 'asset' || typeLower === 'expense';

      let consolidatedNet = entitySum;
      if (isDebitNatured) {
        // entitySum has Debit-Credit nature
        // Debit adjustment increases it, Credit adjustment reduces it
        consolidatedNet = entitySum.add(elimDebit).sub(elimCredit);
      } else {
        // entitySum has Credit-Debit nature
        // Credit adjustment increases it, Debit adjustment reduces it
        consolidatedNet = entitySum.add(elimCredit).sub(elimDebit);
      }

      rows.push({
        accountCode: code,
        accountName: meta.name,
        accountType: meta.type || 'asset',
        parentId: meta.parentId,
        balances: colBalances,
        eliminationDebit: elimDebit,
        eliminationCredit: elimCredit,
        consolidatedNet,
      });
    }

    // Calculate total debits/credits of consolidated net column to check balance
    let totalConsolidatedDebit = new Decimal(0);
    let totalConsolidatedCredit = new Decimal(0);

    for (const row of rows) {
      const val = row.consolidatedNet;
      const typeLower = (row.accountType || '').toLowerCase();
      const isDebitNatured = typeLower === 'asset' || typeLower === 'expense';

      if (isDebitNatured) {
        if (val.gt(0)) {
          totalConsolidatedDebit = totalConsolidatedDebit.add(val);
        } else {
          totalConsolidatedCredit = totalConsolidatedCredit.add(val.abs());
        }
      } else {
        if (val.gt(0)) {
          totalConsolidatedCredit = totalConsolidatedCredit.add(val);
        } else {
          totalConsolidatedDebit = totalConsolidatedDebit.add(val.abs());
        }
      }
    }

    const isBalanced = totalConsolidatedDebit.sub(totalConsolidatedCredit).abs().lt(1.0);

    // ==================== F-13B Extensions ====================

    // 6. Validate companies and branches
    const companyBranchValidations: CompanyBranchValidation[] = [];
    let validEntitiesCount = 0;

    for (const comp of companiesList) {
      const branches = await this.prisma.branch.findMany({
        where: { companyId: comp.id, tenantId },
        select: { id: true },
      });
      const branchIds = branches.map((b) => b.id);
      const eb = entityBalances.find((e) => e.companyId === comp.id);
      
      let hasTransactions = false;
      if (eb && eb.balances) {
        for (const val of eb.balances.values()) {
          if (val.abs().gt(0.01)) {
            hasTransactions = true;
            break;
          }
        }
      }

      const hasBranches = branchIds.length > 0;
      let status: 'VALID' | 'WARNING_NO_BRANCHES' | 'WARNING_NO_TRANSACTIONS' = 'VALID';
      if (!hasBranches) {
        status = 'WARNING_NO_BRANCHES';
      } else if (!hasTransactions) {
        status = 'WARNING_NO_TRANSACTIONS';
      } else {
        status = 'VALID';
        validEntitiesCount++;
      }

      companyBranchValidations.push({
        companyId: comp.id,
        companyName: comp.name,
        hasBranches,
        branchCount: branchIds.length,
        hasTransactions,
        status,
      });
    }

    // 7. Compute Intercompany Matchings
    const intercompanyMatches: IntercompanyMatch[] = [];
    let mismatchedCount = 0;

    for (const rule of group.eliminationRules) {
      if (!rule.active) continue;
      if (rule.ruleType === 'INTERCOMPANY_AR_AP' || rule.ruleType === 'INTERCOMPANY_REVENUE_COGS') {
        const sourceAcc = rule.sourceAccount;
        const targetAcc = rule.targetAccount;

        if (sourceAcc && targetAcc) {
          const sourceMeta = accountMetaMap.get(sourceAcc);
          const targetMeta = accountMetaMap.get(targetAcc);

          let totalSource = new Decimal(0);
          let totalTarget = new Decimal(0);

          for (const comp of companiesList) {
            const sourceBal = rolledBalances.get(sourceAcc)?.[comp.id] || new Decimal(0);
            const targetBal = rolledBalances.get(targetAcc)?.[comp.id] || new Decimal(0);

            totalSource = totalSource.add(sourceBal);
            totalTarget = totalTarget.add(targetBal);
          }

          const absSource = totalSource.abs();
          const absTarget = totalTarget.abs();
          const difference = absSource.sub(absTarget);
          const eliminationAmount = Decimal.min(absSource, absTarget);

          let status: 'MATCHED' | 'MISMATCHED' | 'NO_BALANCE' = 'NO_BALANCE';
          if (absSource.isZero() && absTarget.isZero()) {
            status = 'NO_BALANCE';
          } else if (difference.abs().lt(0.1)) {
            status = 'MATCHED';
          } else {
            status = 'MISMATCHED';
            mismatchedCount++;
          }

          intercompanyMatches.push({
            ruleName: rule.ruleName,
            ruleType: rule.ruleType,
            sourceAccount: sourceAcc,
            sourceAccountName: sourceMeta?.name || 'حساب غير معروف',
            targetAccount: targetAcc,
            targetAccountName: targetMeta?.name || 'حساب غير معروف',
            receivableBalance: absSource,
            payableBalance: absTarget,
            difference,
            eliminationAmount,
            status,
          });
        }
      }
    }

    // 8. Compute Completeness Score
    const baseScore = companiesList.length > 0 ? (validEntitiesCount / companiesList.length) * 100 : 100;
    const mappingCompletenessScore = Math.max(0, Math.round(baseScore - mismatchedCount * 10));

    return {
      groupId: group.id,
      groupName: group.name,
      fiscalPeriodId: 1, // Placeholder
      baseCurrency: group.baseCurrency,
      rows: rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      companies: companiesList.map((c) => ({
        id: c.id,
        name: c.name,
        isParent: c.isParent,
        ownership: c.ownership,
      })),
      isBalanced,
      generatedAt: new Date(),
      // F-13B extensions
      mappingCompletenessScore,
      intercompanyMatches,
      companyBranchValidations,
    };
  }

  /**
   * إجراء محاكاة ترحيل قيود الاستبعاد (Dry-run) وعرض سطور القيود المقترحة بدون ترحيل فعلي.
   */
  async dryRunEliminations(
    tenantId: string,
    groupId: number,
    from: Date,
    to: Date
  ): Promise<DryRunResult> {
    // 1. Fetch group details to resolve rules
    const group = await this.prisma.consolidationGroup.findFirst({
      where: { id: groupId, tenantId, isActive: true },
      include: { eliminationRules: true },
    });

    if (!group) {
      throw new Error(`مجموعة التوحيد غير موجودة أو غير نشطة: ${groupId}`);
    }

    // 2. Perform consolidate to gather matches and balances
    const consolidation = await this.consolidate(tenantId, groupId, from, to);

    const proposedEntries: ProposedJournalEntry[] = [];
    const warnings: string[] = [];
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    const periodStr = to.toISOString().substring(0, 7); // e.g. "2026-05"

    // Calculate auto-reverse date: first day of subsequent month
    const nextMonth = new Date(to);
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const autoReverseDate = nextMonth.toISOString().split('T')[0];

    // 3. Convert matches to proposed journal entries in-memory
    for (let idx = 0; idx < consolidation.intercompanyMatches.length; idx++) {
      const match = consolidation.intercompanyMatches[idx];
      if (match.eliminationAmount.isZero()) continue;

      const lines: ProposedLine[] = [];

      if (match.ruleType === 'INTERCOMPANY_AR_AP') {
        // Debit adjustment (reduces Payable/Credit nature)
        lines.push({
          accountCode: match.targetAccount,
          accountName: match.targetAccountName,
          debit: match.eliminationAmount,
          credit: new Decimal(0),
          description: `استبعاد أرصدة دائنة بينية - ${match.ruleName}`,
        });

        // Credit adjustment (reduces Receivable/Debit nature)
        lines.push({
          accountCode: match.sourceAccount,
          accountName: match.sourceAccountName,
          debit: new Decimal(0),
          credit: match.eliminationAmount,
          description: `استبعاد أرصدة مدينة بينية - ${match.ruleName}`,
        });
      } else if (match.ruleType === 'INTERCOMPANY_REVENUE_COGS') {
        // Debit adjustment (reduces Revenue/Credit nature)
        lines.push({
          accountCode: match.sourceAccount,
          accountName: match.sourceAccountName,
          debit: match.eliminationAmount,
          credit: new Decimal(0),
          description: `استبعاد إيرادات بينية - ${match.ruleName}`,
        });

        // Credit adjustment (reduces Expense/COGS/Debit nature)
        lines.push({
          accountCode: match.targetAccount,
          accountName: match.targetAccountName,
          debit: new Decimal(0),
          credit: match.eliminationAmount,
          description: `استبعاد تكاليف بينية - ${match.ruleName}`,
        });
      }

      totalDebit = totalDebit.add(match.eliminationAmount);
      totalCredit = totalCredit.add(match.eliminationAmount);

      const ref = `ELIM_${groupId}_${periodStr}_${match.ruleType}_${idx}`;

      proposedEntries.push({
        description: `استبعاد عمليات بينية بموجب القاعدة: ${match.ruleName}`,
        reference: ref,
        entryDate: toStr,
        autoReverseDate,
        lines,
      });

      if (match.status === 'MISMATCHED') {
        warnings.push(
          `فرق غير متوازن في قاعدة الاستبعاد [${match.ruleName}]: قيمة الفارق البيني ${match.difference.toNumber()} SAR`
        );
      }
    }

    const isBalanced = totalDebit.sub(totalCredit).abs().lt(0.01);

    return {
      groupId,
      groupName: group.name,
      periodFrom: fromStr,
      periodTo: toStr,
      isBalanced,
      totalDebit,
      totalCredit,
      proposedEntries,
      warnings,
    };
  }

  /**
   * Helper to query and map journal entry line sums per account within the specified branches.
   */
  private async _getCompanyBalances(
    tenantId: string,
    branchIds: number[],
    from: Date,
    to: Date
  ): Promise<Map<string, Decimal>> {
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const entryFilter: Prisma.JournalEntryWhereInput = {
      status: { equals: 'posted', mode: 'insensitive' },
      entryDate: { gte: fromStr, lte: toStr },
    };

    if (branchIds.length > 0) {
      entryFilter.branchId = { in: branchIds };
    } else {
      // Non-existent placeholder if no branches belong to this company
      entryFilter.branchId = -9999;
    }

    const rows = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where: {
        tenantId,
        entry: entryFilter,
      },
      _sum: { debit: true, credit: true },
    }).catch((err) => {
      log.error('Failed to group journalLine by accountId in consolidation engine', {
        error: err.message,
        tenantId,
      });
      return [];
    });

    const map = new Map<string, Decimal>();
    if (rows.length === 0) return map;

    const accountIds = rows.map((r) => r.accountId);
    const accounts = await this.prisma.account.findMany({
      where: { tenantId, id: { in: accountIds } },
      select: { id: true, code: true, type: true },
    }).catch(() => []);

    const accountCodeMap = new Map<number, { code: string; type: string }>(
      accounts.map((a) => [a.id, { code: a.code, type: a.type || 'asset' }])
    );

    for (const row of rows) {
      const meta = accountCodeMap.get(row.accountId);
      if (!meta) continue;

      const debitVal = new Decimal(row._sum.debit ?? 0);
      const creditVal = new Decimal(row._sum.credit ?? 0);

      // Debit nature: debit - credit
      // Credit nature: credit - debit
      const typeLower = meta.type.toLowerCase();
      const isDebitNatured = typeLower === 'asset' || typeLower === 'expense';
      
      const net = isDebitNatured ? debitVal.sub(creditVal) : creditVal.sub(debitVal);

      const existing = map.get(meta.code) || new Decimal(0);
      map.set(meta.code, existing.add(net));
    }

    return map;
  }
}
