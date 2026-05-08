/**
 * WHTService — ضريبة الاستقطاع
 * المرجع: نظام ضريبة الدخل السعودي
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

const DEFAULT_WHT_RATES: Record<string, { resident: number; nonResident: number }> = {
  RENT:                  { resident: 0, nonResident: 5  },
  ROYALTY:               { resident: 0, nonResident: 15 },
  TECHNICAL_SERVICES:    { resident: 0, nonResident: 5  },
  MANAGEMENT_FEES:       { resident: 0, nonResident: 20 },
  DIVIDENDS:             { resident: 0, nonResident: 5  },
  INTEREST:              { resident: 0, nonResident: 5  },
  INSURANCE_PREMIUMS:    { resident: 0, nonResident: 5  },
  INTERNATIONAL_TELECOM: { resident: 0, nonResident: 5  },
  OTHER:                 { resident: 0, nonResident: 15 },
};

export type WHTServiceType = keyof typeof DEFAULT_WHT_RATES;

export interface WHTCalculation {
  grossAmount: Decimal;
  whtRate: Decimal;
  whtAmount: Decimal;
  netPayable: Decimal;
}

export class WHTService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  async calculate(
    grossAmount: Decimal,
    serviceType: WHTServiceType,
    isResident: boolean,
    countryCode = 'SA',
  ): Promise<WHTCalculation> {
    const customRule = await (this.prisma as any).wHTRule.findFirst({
      where: { tenantId: this.ctx.tenant.id, serviceType, countryCode, effectiveFrom: { lte: new Date() } },
      orderBy: { effectiveFrom: 'desc' },
    }).catch(() => null);

    const rates = DEFAULT_WHT_RATES[serviceType] ?? DEFAULT_WHT_RATES.OTHER;
    let ratePercent = isResident ? rates.resident : rates.nonResident;
    if (customRule) {
      ratePercent = isResident ? Number(customRule.residentRate) : Number(customRule.nonResidentRate);
    }

    const whtRate = new Decimal(ratePercent);
    const whtAmount = grossAmount.mul(whtRate.div(100)).toDecimalPlaces(2);
    return { grossAmount, whtRate, whtAmount, netPayable: grossAmount.sub(whtAmount) };
  }

  async deductOnPayment(params: {
    supplierId: number;
    invoiceId: number;
    grossAmount: Decimal;
    serviceType: WHTServiceType;
    isResident: boolean;
    countryCode?: string;
  }): Promise<{ transactionId: number; certificateNumber: string; calculation: WHTCalculation }> {
    const calc = await this.calculate(params.grossAmount, params.serviceType, params.isResident, params.countryCode);
    const certNumber = `WHT-${this.ctx.tenant.id}-${Date.now()}`;
    const tx = await (this.prisma as any).wHTTransaction.create({
      data: {
        tenantId: this.ctx.tenant.id,
        supplierId: params.supplierId,
        invoiceId: params.invoiceId,
        baseAmount: params.grossAmount,
        whtRate: calc.whtRate,
        whtAmount: calc.whtAmount,
        certificateNumber: certNumber,
        paidToZATCA: false,
      },
    });
    return { transactionId: tx.id, certificateNumber: certNumber, calculation: calc };
  }

  async generateForm14(yearMonth: string): Promise<{ batchId: number; totalGross: Decimal; totalWHT: Decimal; count: number }> {
    const tenantId = this.ctx.tenant.id;
    const [y, m] = yearMonth.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    const prisma = this.prisma as any;

    const txns = await prisma.wHTTransaction.findMany({ where: { tenantId, createdAt: { gte: start, lte: end }, paidToZATCA: false } });
    const totalGross = txns.reduce((s: Decimal, t: any) => s.add(new Decimal(t.baseAmount)), new Decimal(0));
    const totalWHT   = txns.reduce((s: Decimal, t: any) => s.add(new Decimal(t.whtAmount)), new Decimal(0));

    const batch = await prisma.whtForm14Batch.create({
      data: { tenantId, period: yearMonth, totalGross, totalWht: totalWHT, status: 'DRAFT' },
    });
    return { batchId: batch.id, totalGross, totalWHT, count: txns.length };
  }

  async markAsFiled(batchId: number, zatcaRef: string): Promise<void> {
    await (this.prisma as any).whtForm14Batch.update({
      where: { id: batchId },
      data: { status: 'FILED', zatcaRef, filedAt: new Date() },
    });
  }
}
