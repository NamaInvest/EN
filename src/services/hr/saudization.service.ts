/**
 * SaudizationService — نظام نطاقات + نسبة السعودة + إنذارات الامتثال
 *
 * يحسب:
 *   - نسبة السعودة الفعلية لكل نشاط تجاري
 *   - التصنيف في نطاق (بلاتيني / أخضر مرتفع / أخضر منخفض / أصفر / أحمر)
 *   - الإنذارات المبكرة قبل انخفاض النطاق
 *
 * المرجع: لوائح وزارة الموارد البشرية السعودية + نظام نطاقات 2024
 */
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type NitaqatBand = 'PLATINUM' | 'GREEN_HIGH' | 'GREEN_LOW' | 'YELLOW' | 'RED';

export interface NitaqatResult {
  totalEmployees: number;
  saudiCount: number;
  expatCount: number;
  saudiPct: number;
  band: NitaqatBand;
  minRequiredPct: number;   // الحد الأدنى للنطاق الأخضر
  shortfall: number;        // عدد السعوديين الناقصين للوصول للأخضر
  compliant: boolean;
  alerts: string[];
}

// حدود النطاقات حسب حجم المنشأة ونشاطها (مبسطة)
const NITAQAT_THRESHOLDS = {
  PLATINUM:    0.40,
  GREEN_HIGH:  0.30,
  GREEN_LOW:   0.20,
  YELLOW:      0.10,
  RED:         0,
};

export class SaudizationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** حساب نسبة السعودة والنطاق الحالي */
  async calculateNitaqatRatio(): Promise<NitaqatResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const employees = await prisma.employee?.findMany?.({
      where: { tenantId, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      select: { nationality: true, id: true },
    }).catch(() => []) ?? [];

    const total      = employees.length;
    const saudiCount = employees.filter((e: any) => e.nationality === 'SA' || e.nationality === 'Saudi').length;
    const expatCount = total - saudiCount;
    const saudiPct   = total > 0 ? saudiCount / total : 0;

    const band: NitaqatBand =
      saudiPct >= NITAQAT_THRESHOLDS.PLATINUM   ? 'PLATINUM' :
      saudiPct >= NITAQAT_THRESHOLDS.GREEN_HIGH ? 'GREEN_HIGH' :
      saudiPct >= NITAQAT_THRESHOLDS.GREEN_LOW  ? 'GREEN_LOW' :
      saudiPct >= NITAQAT_THRESHOLDS.YELLOW     ? 'YELLOW' :
      'RED';

    const minRequired  = NITAQAT_THRESHOLDS.GREEN_LOW;
    const targetSaudi  = Math.ceil(total * minRequired);
    const shortfall    = Math.max(0, targetSaudi - saudiCount);
    const compliant    = ['PLATINUM', 'GREEN_HIGH', 'GREEN_LOW'].includes(band);

    const alerts: string[] = [];
    if (!compliant)              alerts.push(`⚠️ المنشأة في النطاق ${band} — مخالفة نظام نطاقات`);
    if (band === 'RED')          alerts.push('🚨 خطر إيقاف الخدمات الحكومية');
    if (shortfall > 0)           alerts.push(`يجب توظيف ${shortfall} سعودي للوصول للنطاق الأخضر`);
    if (saudiPct < minRequired)  alerts.push(`نسبة السعودة الحالية ${(saudiPct * 100).toFixed(1)}% أقل من الحد ${(minRequired * 100).toFixed(0)}%`);

    return { totalEmployees: total, saudiCount, expatCount, saudiPct: +(saudiPct * 100).toFixed(2), band, minRequiredPct: minRequired * 100, shortfall, compliant, alerts };
  }

  /** تقرير المنشأة لرفعه لبوابة قوى */
  async generateNitaqatReport(year: number, month: number): Promise<{
    period: string; result: NitaqatResult; reportJson: object;
  }> {
    const result = await this.calculateNitaqatRatio();
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const reportJson = {
      reportVersion: '2.0',
      period,
      tenantId: this.ctx.tenant.id,
      generatedAt: new Date().toISOString(),
      summary: result,
      recommendation: result.compliant
        ? 'المنشأة ملتزمة بنظام نطاقات'
        : `يجب رفع نسبة السعودة بمقدار ${result.shortfall} موظف سعودي`,
    };

    return { period, result, reportJson };
  }
}
