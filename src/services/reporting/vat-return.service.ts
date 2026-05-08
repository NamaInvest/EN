/**
 * VATReturnService â€” ط§ظ„ط¥ظ‚ط±ط§ط± ط§ظ„ط¶ط±ظٹط¨ظٹ ط§ظ„ط¯ظˆط±ظٹ
 *
 * ط§ظ„ظ†ظ…ط§ط°ط¬: SalesInvoice, PurchaseInvoice, VatCategory, JournalLine
 *
 * ط§ظ„طµظٹط؛ط©:
 *   ط¶ط±ظٹط¨ط© ط§ظ„ظ…ط®ط±ط¬ط§طھ (Output VAT) = ظ…ط¬ظ…ظˆط¹ ط¶ط±ظٹط¨ط© ط§ظ„ظپظˆط§طھظٹط± ط§ظ„طµط§ط¯ط±ط©
 *   ط¶ط±ظٹط¨ط© ط§ظ„ظ…ط¯ط®ظ„ط§طھ (Input VAT)  = ظ…ط¬ظ…ظˆط¹ ط¶ط±ظٹط¨ط© ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ظˆط§ط±ط¯ط©
 *   طµط§ظپظٹ ط§ظ„ط¶ط±ظٹط¨ط© = ط¶ط±ظٹط¨ط© ط§ظ„ظ…ط®ط±ط¬ط§طھ - ط¶ط±ظٹط¨ط© ط§ظ„ظ…ط¯ط®ظ„ط§طھ
 *
 * ZATCA: ظٹظڈظ‚ط¯ظژظ‘ظ… ظƒظ„ 3 ط£ط´ظ‡ط± ظ„ط£ط؛ظ„ط¨ ط§ظ„ظ…ظ†ط´ط¢طھ
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface VATReturnLine {
  category: string;         // S (Standard), Z (Zero), E (Exempt)
  description: string;
  baseAmount: Decimal;
  vatAmount: Decimal;
  vatRate: Decimal;
}

export interface VATReturn {
  period: string;           // YYYY-QN  e.g. 2025-Q1
  from: Date;
  to: Date;
  outputLines: VATReturnLine[];   // ظ…ط¨ظٹط¹ط§طھ
  inputLines: VATReturnLine[];    // ظ…ط´طھط±ظٹط§طھ
  totalOutputVAT: Decimal;
  totalInputVAT: Decimal;
  netVAT: Decimal;           // ظ…ظˆط¬ط¨ = ظ…ط³طھط­ظ‚ | ط³ط§ظ„ط¨ = ظ…ط³طھط±ط¯
  status: 'DRAFT' | 'SUBMITTED';
}

export class VATReturnService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) { }

  /**
   * طھظˆظ„ظٹط¯ ط¥ظ‚ط±ط§ط± ط¶ط±ظٹط¨ط© ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ظ…ط¶ط§ظپط© ظ„ظپطھط±ط© ظ…ط¹ظٹظ†ط©
   */
  async generate(from: Date, to: Date): Promise<VATReturn> {
    const tenantId = this.ctx.tenant.id;
    const period = this._periodLabel(from);
    const prisma = this.prisma as any;

    // â”€â”€ ط¶ط±ظٹط¨ط© ط§ظ„ظ…ط®ط±ط¬ط§طھ (ط§ظ„ظ…ط¨ظٹط¹ط§طھ) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const salesAgg = await prisma.salesInvoice.groupBy({
      by: ['vatCategoryCode'],
      where: { tenantId, date: { gte: from, lte: to }, status: { in: ['POSTED', 'PAID'] } },
      _sum: { totalAmount: true, vatAmount: true },
    }).catch(() => []);

    const outputLines: VATReturnLine[] = salesAgg.map((r: any) => ({
      category: r.vatCategoryCode ?? 'S',
      description: this._categoryLabel(r.vatCategoryCode),
      baseAmount: new Decimal(r._sum.totalAmount ?? 0).sub(new Decimal(r._sum.vatAmount ?? 0)),
      vatAmount: new Decimal(r._sum.vatAmount ?? 0),
      vatRate: r.vatCategoryCode === 'S' ? new Decimal(15) : new Decimal(0),
    }));

    // â”€â”€ ط¶ط±ظٹط¨ط© ط§ظ„ظ…ط¯ط®ظ„ط§طھ (ط§ظ„ظ…ط´طھط±ظٹط§طھ) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const purchAgg = await prisma.purchaseInvoice.groupBy({
      by: ['vatCategoryCode'],
      where: { tenantId, date: { gte: from, lte: to }, status: { in: ['POSTED', 'PAID'] } },
      _sum: { totalAmount: true, vatAmount: true },
    }).catch(() => []);

    const inputLines: VATReturnLine[] = purchAgg.map((r: any) => ({
      category: r.vatCategoryCode ?? 'S',
      description: this._categoryLabel(r.vatCategoryCode),
      baseAmount: new Decimal(r._sum.totalAmount ?? 0).sub(new Decimal(r._sum.vatAmount ?? 0)),
      vatAmount: new Decimal(r._sum.vatAmount ?? 0),
      vatRate: new Decimal(15),
    }));

    const totalOutputVAT = outputLines.reduce((s, l) => s.add(l.vatAmount), new Decimal(0));
    const totalInputVAT = inputLines.reduce((s, l) => s.add(l.vatAmount), new Decimal(0));
    const netVAT = totalOutputVAT.sub(totalInputVAT);

    return { period, from, to, outputLines, inputLines, totalOutputVAT, totalInputVAT, netVAT, status: 'DRAFT' };
  }

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private _periodLabel(date: Date): string {
    const q = Math.ceil((date.getMonth() + 1) / 3);
    return `${date.getFullYear()}-Q${q}`;
  }

  private _categoryLabel(code: string): string {
    const map: Record<string, string> = {
      S: 'ط®ط§ط¶ط¹ط© ظ„ظ„ط¶ط±ظٹط¨ط© (15%)',
      Z: 'ظ…ط¹ظپط§ط© â€” طµظپط±',
      E: 'ظ…ط¹ظپط§ط©',
      O: 'ط®ط§ط±ط¬ ط§ظ„ظ†ط·ط§ظ‚',
    };
    return map[code] ?? code;
  }
}

