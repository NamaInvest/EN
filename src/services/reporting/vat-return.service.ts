/**
 * VATReturnService — الإقرار الضريبي الدوري
 *
 * النماذج: SalesInvoice, PurchaseInvoice, VatCategory, JournalLine
 *
 * الصيغة:
 *   ضريبة المخرجات (Output VAT) = مجموع ضريبة الفواتير الصادرة
 *   ضريبة المدخلات (Input VAT)  = مجموع ضريبة الفواتير الواردة
 *   صافي الضريبة = ضريبة المخرجات - ضريبة المدخلات
 *
 * ZATCA: يُقدَّم كل 3 أشهر لأغلب المنشآت
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
  outputLines: VATReturnLine[];   // مبيعات
  inputLines: VATReturnLine[];    // مشتريات
  totalOutputVAT: Decimal;
  totalInputVAT: Decimal;
  netVAT: Decimal;           // موجب = مستحق | سالب = مسترد
  status: 'DRAFT' | 'SUBMITTED';
}

export class VATReturnService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * توليد إقرار ضريبة القيمة المضافة لفترة معينة
   */
  async generate(from: Date, to: Date): Promise<VATReturn> {
    const tenantId = this.ctx.tenant.id;
    const period = this._periodLabel(from);
    const prisma = this.prisma as any;

    // ── ضريبة المخرجات (المبيعات) ────────────────────────────────────────
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

    // ── ضريبة المدخلات (المشتريات) ───────────────────────────────────────
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
    const totalInputVAT  = inputLines.reduce((s, l) => s.add(l.vatAmount), new Decimal(0));
    const netVAT = totalOutputVAT.sub(totalInputVAT);

    return { period, from, to, outputLines, inputLines, totalOutputVAT, totalInputVAT, netVAT, status: 'DRAFT' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _periodLabel(date: Date): string {
    const q = Math.ceil((date.getMonth() + 1) / 3);
    return `${date.getFullYear()}-Q${q}`;
  }

  private _categoryLabel(code: string): string {
    const map: Record<string, string> = {
      S: 'خاضعة للضريبة (15%)',
      Z: 'معفاة — صفر',
      E: 'معفاة',
      O: 'خارج النطاق',
    };
    return map[code] ?? code;
  }
}
