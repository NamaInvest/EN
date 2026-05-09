/**
 * Consolidation Service — Multi-entity financial consolidation
 * Uses JournalEntry/JournalLine per tenant + Account for aggregation
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ConsolidatedBalance {
  accountCode: string;
  accountName: string;
  entities: Record<string, number>; // tenantId → balance
  total: number;
  intercompanyElimination: number;
  consolidated: number;
}

export interface ConsolidationResult {
  parentTenantId: string;
  childTenantIds: string[];
  asOfDate: Date;
  balances: ConsolidatedBalance[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  eliminationEntries: number;
}

export class ConsolidationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run multi-entity consolidation
   */
  async runConsolidation(
    parentTenantId: string,
    childTenantIds: string[],
    asOfDate: Date,
    intercompanyAccounts: string[] = [], // account codes to eliminate
  ): Promise<ConsolidationResult> {
    const allTenants = [parentTenantId, ...childTenantIds];
    const balanceMap = new Map<string, ConsolidatedBalance>();

    // Aggregate journal lines per account per tenant
    for (const tenantId of allTenants) {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          tenantId,
          entry: { entryDate: { lte: asOfDate.toISOString().split('T')[0] }, status: 'posted' },
        },
        select: {
          accountId: true,
          debit: true,
          credit: true,
          account: { select: { code: true, name: true } },
        },
      });

      for (const line of lines) {
        const code = line.account.code;
        const existing = balanceMap.get(code) ?? {
          accountCode: code,
          accountName: line.account.name,
          entities: {} as Record<string, number>,
          total: 0,
          intercompanyElimination: 0,
          consolidated: 0,
        };

        const net = Number(line.debit ?? 0) - Number(line.credit ?? 0);
        const ent = existing.entities as Record<string, number>;
        ent[tenantId] = (ent[tenantId] ?? 0) + net;
        existing.total += net;
        balanceMap.set(code, existing);
      }
    }

    // Apply intercompany eliminations
    let eliminationEntries = 0;
    for (const [code, bal] of balanceMap) {
      if (intercompanyAccounts.includes(code)) {
        bal.intercompanyElimination = bal.total; // Eliminate entire balance
        bal.consolidated = 0;
        eliminationEntries++;
      } else {
        bal.consolidated = bal.total;
      }
    }

    const balances = Array.from(balanceMap.values());

    // P&L vs Balance Sheet separation would require account type mapping
    const totalAssets = balances
      .filter((b) => b.consolidated > 0) // simplified: positive = asset
      .reduce((s, b) => s + b.consolidated, 0);

    const totalLiabilities = balances
      .filter((b) => b.consolidated < 0 && b.accountCode.startsWith('2')) // liability accounts
      .reduce((s, b) => s + Math.abs(b.consolidated), 0);

    const totalEquity = totalAssets - totalLiabilities;

    return {
      parentTenantId,
      childTenantIds,
      asOfDate,
      balances,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      eliminationEntries,
    };
  }

  /**
   * Get intercompany balances between entities
   */
  async getIntercompanyBalances(tenantIds: string[], asOfDate: Date): Promise<{
    fromTenant: string;
    toTenant: string;
    netBalance: number;
  }[]> {
    // Simplified: find journal lines with cross-tenant references in notes
    const results: { fromTenant: string; toTenant: string; netBalance: number }[] = [];

    for (let i = 0; i < tenantIds.length; i++) {
      for (let j = i + 1; j < tenantIds.length; j++) {
        // This would need proper intercompany tracking in real implementation
        results.push({ fromTenant: tenantIds[i], toTenant: tenantIds[j], netBalance: 0 });
      }
    }

    return results;
  }
}
