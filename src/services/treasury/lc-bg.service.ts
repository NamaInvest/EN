/**
 * Letter of Credit & Bank Guarantee Service
 * Trade finance instruments management
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class LcBgService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Open a new Letter of Credit
   */
  async openLC(tenantId: string, data: {
    lcNumber: string;
    bankId: number;
    supplierId: number;
    amount: number;
    currencyId: number;
    exchangeRate: number;
    expiryDate: Date;
    marginPercent: number;
    portOfLoading?: string;
    portOfDischarge?: string;
    notes?: string;
  }): Promise<number> {
    const marginPaid = data.amount * (data.marginPercent / 100);

    const lc = await this.prisma.letterOfCredit.create({
      data: {
        tenantId,
        lcNumber: data.lcNumber,
        bankId: data.bankId,
        supplierId: data.supplierId,
        amount: new Decimal(data.amount),
        currencyId: data.currencyId,
        exchangeRate: new Decimal(data.exchangeRate),
        openDate: new Date(),
        expiryDate: data.expiryDate,
        marginPercent: new Decimal(data.marginPercent),
        marginPaid: new Decimal(marginPaid),
        portOfLoading: data.portOfLoading,
        portOfDischarge: data.portOfDischarge,
        notes: data.notes,
        status: 'open',
      },
    });

    return lc.id;
  }

  /**
   * Update LC status
   */
  async updateStatus(tenantId: string, lcId: number, status: 'draft' | 'open' | 'shipped' | 'closed'): Promise<void> {
    await this.prisma.letterOfCredit.update({
      where: { id: lcId },
      data: { status },
    });
  }

  /**
   * Get active LCs with expiry alerts
   */
  async getActiveLCs(tenantId: string): Promise<{
    id: number;
    lcNumber: string;
    amount: number;
    expiryDate: Date;
    daysToExpiry: number;
    status: string;
    isExpiringSoon: boolean;
  }[]> {
    const today = new Date();

    const lcs = await this.prisma.letterOfCredit.findMany({
      where: { tenantId, status: { in: ['draft', 'open', 'shipped'] } },
      select: {
        id: true,
        lcNumber: true,
        amount: true,
        expiryDate: true,
        status: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return lcs.map((lc) => {
      const ms = lc.expiryDate.getTime() - today.getTime();
      const daysToExpiry = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return {
        id: lc.id,
        lcNumber: lc.lcNumber,
        amount: Number(lc.amount),
        expiryDate: lc.expiryDate,
        daysToExpiry,
        status: lc.status,
        isExpiringSoon: daysToExpiry <= 30,
      };
    });
  }

  /**
   * Get LC portfolio summary
   */
  async getPortfolioSummary(tenantId: string): Promise<{
    totalLCs: number;
    totalOpenAmount: number;
    totalMarginPaid: number;
    expiringSoon: number;
    byStatus: Record<string, number>;
  }> {
    const lcs = await this.prisma.letterOfCredit.findMany({
      where: { tenantId },
      select: { status: true, amount: true, marginPaid: true, expiryDate: true },
    });

    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const openLCs = lcs.filter((lc) => lc.status === 'open');
    const byStatus = lcs.reduce<Record<string, number>>((acc, lc) => {
      acc[lc.status] = (acc[lc.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalLCs: lcs.length,
      totalOpenAmount: openLCs.reduce((s, lc) => s + Number(lc.amount), 0),
      totalMarginPaid: openLCs.reduce((s, lc) => s + Number(lc.marginPaid), 0),
      expiringSoon: lcs.filter((lc) => lc.expiryDate <= in30Days && lc.status !== 'closed').length,
      byStatus,
    };
  }
}
