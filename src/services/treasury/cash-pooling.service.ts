/**
 * Cash Pooling Service
 * Virtual notional pooling across bank accounts
 */
import { PrismaClient } from '@prisma/client';

export interface PoolPosition {
  accountId: number;
  accountName: string;
  balance: number;
  currency: string;
  poolContribution: number;
}

export class CashPoolingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get notional pool position (SAR accounts only)
   */
  async getPoolPosition(tenantId: string): Promise<{
    accounts: PoolPosition[];
    netPoolBalance: number;
    surplusAccounts: PoolPosition[];
    deficitAccounts: PoolPosition[];
    interestSaved: number; // estimated annual
  }> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true, currency: 'SAR', deletedAt: null },
      select: {
        id: true,
        bankName: true,
        accountName: true,
        currentBalance: true,
        currency: true,
      },
    });

    const positions: PoolPosition[] = accounts.map((a) => ({
      accountId: a.id,
      accountName: `${a.bankName} - ${a.accountName}`,
      balance: Number(a.currentBalance),
      currency: a.currency,
      poolContribution: Number(a.currentBalance), // Notional: each acc contributes its balance
    }));

    const netPoolBalance = positions.reduce((s, p) => s + p.balance, 0);
    const surplusAccounts = positions.filter((p) => p.balance > 0);
    const deficitAccounts = positions.filter((p) => p.balance < 0);

    // Estimated interest saved: deficit accounts don't pay overdraft interest
    const totalDeficit = deficitAccounts.reduce((s, p) => s + Math.abs(p.balance), 0);
    const overdraftRate = 0.05; // 5% annual overdraft rate assumption
    const interestSaved = totalDeficit * overdraftRate;

    return { accounts: positions, netPoolBalance, surplusAccounts, deficitAccounts, interestSaved };
  }

  /**
   * Optimize inter-account transfers to minimize idle cash
   */
  async optimizeTransfers(tenantId: string, targetBalance: number = 50000): Promise<{
    from: { accountId: number; name: string };
    to: { accountId: number; name: string };
    amount: number;
  }[]> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true, currency: 'SAR', deletedAt: null },
      select: { id: true, bankName: true, accountName: true, currentBalance: true },
    });

    const transfers: { from: any; to: any; amount: number }[] = [];
    const surplus = accounts.filter((a) => Number(a.currentBalance) > targetBalance);
    const deficit = accounts.filter((a) => Number(a.currentBalance) < targetBalance);

    for (const s of surplus) {
      for (const d of deficit) {
        const excess = Number(s.currentBalance) - targetBalance;
        const need = targetBalance - Number(d.currentBalance);
        const amount = Math.min(excess, need);
        if (amount > 1000) {
          transfers.push({
            from: { accountId: s.id, name: `${s.bankName} - ${s.accountName}` },
            to: { accountId: d.id, name: `${d.bankName} - ${d.accountName}` },
            amount,
          });
        }
      }
    }

    return transfers;
  }
}
