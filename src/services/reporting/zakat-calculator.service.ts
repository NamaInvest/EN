/**
 * ZakatCalculatorService — حساب الزكاة الشرعية
 *
 * النموذج: ZakatAssessment, ZakatAdjustment
 *
 * الصيغة المعتمدة لدى هيئة الزكاة والضريبة والجمارك:
 *
 *   وعاء الزكاة = (حقوق الملكية + الالتزامات طويلة الأجل + التعديلات)
 *               - (الأصول الثابتة صافية + الاستثمارات طويلة الأجل)
 *
 *   الزكاة المستحقة = وعاء الزكاة × نسبة ربع العشر (2.578% للسنة الهجرية)
 *
 * المرجع: اللائحة التنفيذية لنظام الزكاة، هيئة الزكاة والضريبة والجمارك 1444هـ
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

// النسبة الشرعية: ربع العشر = 2.5% من وعاء الزكاة للسنة الميلادية
// للسنة الهجرية (354 يوم): 2.5% × (354/365) = 2.4247%
// غالباً تُستخدم 2.5% مباشرة كتقريب معتمد
const ZAKAT_RATE = new Decimal('0.025');

export interface ZakatComponents {
  equity: Decimal;                // حقوق الملكية (رأس المال + الأرباح المحتجزة)
  longTermLiabilities: Decimal;   // قروض وسندات طويلة الأجل
  fixedAssetsBookValue: Decimal;  // صافي الأصول الثابتة
  longTermInvestments: Decimal;   // استثمارات طويلة الأجل (حصص في شركات تابعة)
  adjustmentsTotal: Decimal;      // التعديلات المعتمدة (إن وجدت)
  netProfit: Decimal;             // صافي الربح (يُضاف أحياناً)
}

export interface ZakatCalculation {
  components: ZakatComponents;
  zakatBase: Decimal;             // وعاء الزكاة
  zakatDue: Decimal;              // الزكاة المستحقة
  zakatRate: Decimal;             // النسبة المطبقة
  isZakatApplicable: boolean;     // وعاء > 0 → مستحق
}

export interface ZakatAssessmentResult {
  assessmentId: number;
  fiscalYearId: number;
  hijriYear: string;
  calculation: ZakatCalculation;
  status: string;
}

export class ZakatCalculatorService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * حساب الزكاة بناءً على أرقام الميزانية العمومية
   */
  calculate(components: ZakatComponents): ZakatCalculation {
    // وعاء الزكاة = (حقوق الملكية + التزامات طويلة أجل + تعديلات) - (أصول ثابتة + استثمارات)
    const positives = components.equity
      .add(components.longTermLiabilities)
      .add(components.adjustmentsTotal);

    const negatives = components.fixedAssetsBookValue
      .add(components.longTermInvestments);

    const zakatBase = positives.sub(negatives);
    const isApplicable = zakatBase.gt(0);

    // الزكاة لا تُحسب على وعاء سالب
    const zakatDue = isApplicable
      ? zakatBase.mul(ZAKAT_RATE).toDecimalPlaces(2)
      : new Decimal(0);

    return {
      components,
      zakatBase: zakatBase.toDecimalPlaces(2),
      zakatDue,
      zakatRate: ZAKAT_RATE.mul(100),      // 2.5
      isZakatApplicable: isApplicable,
    };
  }

  /**
   * توليد تقييم الزكاة من أرقام GL الفعلية
   */
  async generateAssessment(
    fiscalYearId: number,
    hijriYear: string,
  ): Promise<ZakatAssessmentResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // جلب الأرقام من ميزانية السنة المالية
    const glSummary = await this._extractGLComponents(fiscalYearId);
    const calculation = this.calculate(glSummary);

    // جلب التعديلات المعتمدة مسبقاً
    const adjustments = await prisma.zakatAdjustment.aggregate({
      where: { tenantId, fiscalYearId },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));

    const adjustmentsTotal = new Decimal(adjustments._sum.amount ?? 0);
    const finalCalc = this.calculate({ ...glSummary, adjustmentsTotal });

    // حفظ أو تحديث التقييم
    const existing = await prisma.zakatAssessment.findFirst({
      where: { tenantId, fiscalYearId },
    });

    const data = {
      tenantId,
      fiscalYearId,
      assessmentDate: new Date(),
      hijriYear,
      status: 'DRAFT',
      equity: finalCalc.components.equity,
      longTermLiabilities: finalCalc.components.longTermLiabilities,
      netProfit: finalCalc.components.netProfit,
      fixedAssetsBookValue: finalCalc.components.fixedAssetsBookValue,
      longTermInvestments: finalCalc.components.longTermInvestments,
      adjustmentsTotal,
      zakatBase: finalCalc.zakatBase,
      zakatDue: finalCalc.zakatDue,
    };

    let assessment: any;
    if (existing) {
      assessment = await prisma.zakatAssessment.update({
        where: { id: existing.id },
        data,
      });
    } else {
      assessment = await prisma.zakatAssessment.create({ data });
    }

    return {
      assessmentId: assessment.id,
      fiscalYearId,
      hijriYear,
      calculation: finalCalc,
      status: assessment.status,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * استخراج مكونات الزكاة من الميزانية العمومية (GL)
   * يجلب أرصدة الحسابات ذات الصلة
   */
  private async _extractGLComponents(fiscalYearId: number): Promise<ZakatComponents> {
    const prisma = this.prisma as any;
    const tenantId = this.ctx.tenant.id;

    // جلب الميزانية الختامية للسنة
    const balances = await prisma.journalLine.groupBy({
      by: ['account'],
      where: {
        tenantId,
        journalEntry: { fiscalYear: { id: fiscalYearId }, status: 'POSTED' },
      },
      _sum: { debit: true, credit: true },
    }).catch(() => []);

    // تصنيف الحسابات (تبسيط — في الواقع يُحدد حسب شجرة الحسابات)
    let equity = new Decimal(0);
    let ltLiabilities = new Decimal(0);
    let fixedAssets = new Decimal(0);
    let ltInvestments = new Decimal(0);
    let netProfit = new Decimal(0);

    for (const b of balances) {
      const net = new Decimal(b._sum.credit ?? 0).sub(new Decimal(b._sum.debit ?? 0));
      const code: string = b.account?.code ?? '';

      if (code.startsWith('3'))      equity = equity.add(net.abs());          // حقوق الملكية
      else if (code.startsWith('27')) ltLiabilities = ltLiabilities.add(net.abs()); // التزامات طويلة الأجل
      else if (code.startsWith('14')) fixedAssets = fixedAssets.add(net.abs());     // أصول ثابتة
      else if (code.startsWith('15')) ltInvestments = ltInvestments.add(net.abs()); // استثمارات طويلة الأجل
      else if (code.startsWith('5') || code.startsWith('6')) {
        const profitNet = new Decimal(b._sum.credit ?? 0).sub(new Decimal(b._sum.debit ?? 0));
        netProfit = netProfit.add(profitNet);
      }
    }

    return { equity, longTermLiabilities: ltLiabilities, fixedAssetsBookValue: fixedAssets, longTermInvestments: ltInvestments, adjustmentsTotal: new Decimal(0), netProfit };
  }
}
