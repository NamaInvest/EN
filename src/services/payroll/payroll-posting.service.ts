/**
 * PayrollPostingService — ترحيل الرواتب إلى الدفاتر المحاسبية
 *
 * النماذج: PayrollRun, PayrollRunLine, JournalEntry, JournalLine
 *
 * القيد:
 *   DR 5110  مصروف رواتب (الإجمالي لكل قسم)
 *   DR 5120  مصروف GOSI الشركة
 *   DR 5121  مصروف ساند
 *   CR 2340  GOSI مستحق (حصة الموظف + الشركة)
 *   CR 2341  ساند مستحق
 *   CR 2350  WHT مستحق (للأجانب)
 *   CR 2360  استقطاعات أخرى
 *   CR 2330  صافي الرواتب المستحقة الدفع (via WPS لاحقاً)
 *
 * المرجع: SOCPA + متطلبات هيئة الزكاة للشركات السعودية
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface PayrollJEPreview {
  totalGross: Decimal;
  totalGosiEmployee: Decimal;
  totalGosiCompany: Decimal;
  totalSaned: Decimal;
  totalWHT: Decimal;
  totalOtherDeductions: Decimal;
  totalNetPayable: Decimal;
  totalDebit: Decimal;
  totalCredit: Decimal;
  lines: { account: string; accountName: string; debit: Decimal; credit: Decimal; description: string }[];
  isBalanced: boolean;
}

export interface PayrollPostResult {
  journalEntryId: number;
  runId: number;
  totalDebit: Decimal;
  totalCredit: Decimal;
}

export class PayrollPostingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * معاينة القيد المحاسبي قبل الترحيل
   */
  async previewJE(runId: number): Promise<PayrollJEPreview> {
    const run = await this._loadRun(runId);
    return this._buildPreview(run);
  }

  /**
   * ترحيل رواتب الدورة إلى الدفاتر
   */
  async postPayrollRun(runId: number): Promise<PayrollPostResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const run = await this._loadRun(runId);
    if (!['APPROVED', 'CONFIRMED'].includes(run.status)) {
      throw new Error(`لا يمكن ترحيل دورة بحالة "${run.status}". يجب أن تكون موافقاً عليها.`);
    }

    const preview = this._buildPreview(run);
    if (!preview.isBalanced) {
      throw new Error(`القيد غير متوازن — فرق: ${preview.totalDebit?.sub?.(preview.totalCredit)}`);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const runMonth = run.month ? String(run.month).padStart(2, '0') : '??';
      const runYear  = run.year ?? new Date().getFullYear();

      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          reference:   `PAY-GL-${runId}-${runYear}-${runMonth}`,
          description: `ترحيل رواتب ${runYear}/${runMonth}`,
          date:        new Date(),
          status:      'POSTED',
          sourceType:  'PAYROLL',
          sourceId:    runId,
          lines: {
            create: preview.lines.map((l) => ({
              tenantId,
              accountCode: l.account,
              debit:       l.debit,
              credit:      l.credit,
              description: l.description,
            })),
          },
        },
      });

      await tx.payrollRun.update({
        where: { id: runId },
        data:  { status: 'POSTED', glJournalId: je.id },
      });

      return je;
    });

    const totalDebit  = preview.lines.reduce((s, l) => s.add(l.debit),  new Decimal(0));
    const totalCredit = preview.lines.reduce((s, l) => s.add(l.credit), new Decimal(0));

    return { journalEntryId: result.id, runId, totalDebit, totalCredit };
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async _loadRun(runId: number) {
    const run = await (this.prisma as any).payrollRun.findFirst({
      where: { id: runId, tenantId: this.ctx.tenant.id },
      include: { lines: { include: { employee: true } } },
    });
    if (!run) throw new Error(`دورة الرواتب ${runId} غير موجودة`);
    return run;
  }

  private _buildPreview(run: any): PayrollJEPreview {
    const lines = run.lines ?? [];

    let totalGross          = new Decimal(0);
    let totalGosiEmployee   = new Decimal(0);
    let totalGosiCompany    = new Decimal(0);
    let totalSaned          = new Decimal(0);
    let totalWHT            = new Decimal(0);
    let totalOtherDeductions = new Decimal(0);
    let totalNet            = new Decimal(0);

    for (const line of lines) {
      totalGross          = totalGross.add(new Decimal(line.grossSalary ?? 0));
      totalGosiEmployee   = totalGosiEmployee.add(new Decimal(line.gosiEmployee ?? 0));
      totalGosiCompany    = totalGosiCompany.add(new Decimal(line.gosiCompany ?? 0));
      totalSaned          = totalSaned.add(new Decimal(line.sanedCompany ?? 0));
      totalWHT            = totalWHT.add(new Decimal(line.withholdingTax ?? 0));
      totalOtherDeductions = totalOtherDeductions.add(new Decimal(line.otherDeductions ?? 0));
      totalNet            = totalNet.add(new Decimal(line.netSalary ?? 0));
    }

    const jeLlines: PayrollJEPreview['lines'] = [
      // DR: مصروف الراتب الإجمالي
      { account: '5110', accountName: 'مصروف الرواتب والأجور', debit: totalGross, credit: new Decimal(0), description: 'إجمالي رواتب الدورة' },
      // DR: GOSI شركة
      { account: '5120', accountName: 'مصروف التأمينات الاجتماعية', debit: totalGosiCompany, credit: new Decimal(0), description: 'حصة الشركة في GOSI' },
      // DR: ساند
      { account: '5121', accountName: 'مصروف ساند', debit: totalSaned, credit: new Decimal(0), description: 'مصروف ساند للتأمين ضد التعطل' },
      // CR: GOSI مستحق (موظف + شركة)
      { account: '2340', accountName: 'التأمينات الاجتماعية المستحقة', debit: new Decimal(0), credit: totalGosiEmployee.add(totalGosiCompany), description: 'GOSI مستحق للتسديد' },
      // CR: ساند مستحق
      { account: '2341', accountName: 'ساند مستحق', debit: new Decimal(0), credit: totalSaned, description: 'ساند مستحق للتسديد' },
      // CR: WHT
      { account: '2350', accountName: 'ضريبة الاستقطاع المستحقة', debit: new Decimal(0), credit: totalWHT, description: 'WHT للموظفين الأجانب' },
      // CR: استقطاعات أخرى
      { account: '2360', accountName: 'استقطاعات الموظفين', debit: new Decimal(0), credit: totalOtherDeductions, description: 'قسط القرض + سلف + غير ذلك' },
      // CR: صافي الراتب المستحق (سيُدفع عبر WPS)
      { account: '2330', accountName: 'الرواتب المستحقة الدفع', debit: new Decimal(0), credit: totalNet, description: 'صافي الرواتب للدفع عبر WPS' },
    ].filter((l) => l.debit.gt(0) || l.credit.gt(0)); // حذف الأسطر الصفرية

    const totalDebit  = jeLlines.reduce((s, l) => s.add(l.debit),  new Decimal(0));
    const totalCredit = jeLlines.reduce((s, l) => s.add(l.credit), new Decimal(0));

    return {
      totalGross, totalGosiEmployee, totalGosiCompany, totalSaned, totalWHT,
      totalOtherDeductions, totalNetPayable: totalNet,
      totalDebit, totalCredit,
      lines: jeLlines,
      isBalanced: totalDebit.sub(totalCredit).abs().lte(new Decimal('0.01')),
    };
  }
}
