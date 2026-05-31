import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/observability/logger';

const log = logger.child({ module: 'accounting.year-end-close' });

export interface YearEndCloseValidation {
  canClose: boolean;
  blockers: string[];
  warnings: string[];
  checklistProgress: { total: number; completed: number };
}

export interface ClosingJEResult {
  success: boolean;
  journalEntryId: number;
  totalRevenue: Decimal;
  totalExpense: Decimal;
  netIncome: Decimal;
}

export class YearEndCloseEngine {
  /**
   * 1. التحقق من جاهزية السنة المالية للإغلاق
   * يتطلب ذلك إغلاق كافة الفترات الشهرية (12 شهراً) في السنة وخلو النظام من القيود المعلقة.
   */
  static async validateYearReadiness(
    tenantId: string,
    fiscalYear: string // e.g. "2026"
  ): Promise<YearEndCloseValidation> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // أ. التحقق من إغلاق كافة الفترات الشهرية للسنة
    const periods = await prisma.fiscalPeriod.findMany({
      where: {
        tenantId,
        year: parseInt(fiscalYear, 10),
      },
    });

    const totalExpected = 12;
    const closedCount = periods.filter((p: any) => p.status === 'closed').length;

    if (periods.length < totalExpected || closedCount < totalExpected) {
      blockers.push(
        `يجب إغلاق كافة الفترات الشهرية الـ 12 للسنة المالية ${fiscalYear} قبل الإغلاق السنوي. تم إغلاق ${closedCount} فقط.`
      );
    }

    // ب. التحقق من خلو النظام من أي قيود معلقة (DRAFT) للسنة المعنية
    const draftJournals = await prisma.journalEntry.count({
      where: {
        tenantId,
        entryDate: {
          gte: `${fiscalYear}-01-01T00:00:00.000Z`,
          lte: `${fiscalYear}-12-31T23:59:59.999Z`,
        },
        status: 'DRAFT',
      },
    });

    if (draftJournals > 0) {
      blockers.push(`يوجد عدد ${draftJournals} قيود محاسبية معلقة (Draft) لم تُرحَّل في هذه السنة.`);
    }

    // ج. التحقق من تسوية البنود المفتوحة (AR/AP) — كتحذير موجه
    const openItems = await prisma.openItem?.count?.({
      where: {
        tenantId,
        dueDate: {
          lte: new Date(`${fiscalYear}-12-31T23:59:59.999Z`),
        },
        status: 'OPEN',
      },
    }).catch(() => 0);

    if (openItems > 0) {
      warnings.push(`يوجد عدد ${openItems} بنود مفتوحة في حسابات المدينين والدائنين لم تُسوَّى بعد.`);
    }

    return {
      canClose: blockers.length === 0,
      blockers,
      warnings,
      checklistProgress: { total: totalExpected, completed: closedCount },
    };
  }

  /**
   * 2. إقفال قائمة الدخل (الإيرادات والمصاريف) وترحيل الأرصدة إلى الأرباح المحتجزة
   * DR حسابات الإيرادات (لتصفيرها)
   * CR حسابات المصاريف (لتصفيرها)
   * الفرق → DR/CR لحساب الأرباح المحتجزة (Retained Earnings Account)
   */
  static async closeIncomeStatement({
    tenantId,
    fiscalYear,
    retainedEarningsAccountId,
    userId,
  }: {
    tenantId: string;
    fiscalYear: string;
    retainedEarningsAccountId: number;
    userId: string;
  }): Promise<ClosingJEResult> {
    const validation = await this.validateYearReadiness(tenantId, fiscalYear);
    if (!validation.canClose) {
      throw new Error(`لا يمكن إجراء الإغلاق السنوي: ${validation.blockers.join('، ')}`);
    }

    // جلب كافة قيود اليومية للعام المعني لحساب الأرصدة النهائية للحسابات
    // حسابات الإيرادات تبدأ بـ 4 وحسابات المصاريف تبدأ بـ 5
    const journalLines = await (prisma as any).journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: `${fiscalYear}-01-01T00:00:00.000Z`,
            lte: `${fiscalYear}-12-31T23:59:59.999Z`,
          },
          status: 'POSTED',
        },
      },
      include: {
        account: true,
      },
    });

    // حساب الرصيد الصافي لكل حساب
    const balances: Record<number, { code: string; name: string; debit: Decimal; credit: Decimal }> = {};

    for (const line of journalLines) {
      const accountId = line.accountId;
      const accountCode = line.account.code;
      const accountName = line.account.name;

      if (!balances[accountId]) {
        balances[accountId] = {
          code: accountCode,
          name: accountName,
          debit: new Decimal(0),
          credit: new Decimal(0),
        };
      }

      balances[accountId].debit = balances[accountId].debit.add(line.debit);
      balances[accountId].credit = balances[accountId].credit.add(line.credit);
    }

    const closingLines: any[] = [];
    let totalRevenue = new Decimal(0);
    let totalExpense = new Decimal(0);

    for (const [accountIdStr, bal] of Object.entries(balances)) {
      const accountId = parseInt(accountIdStr, 10);
      const isRevenue = bal.code.startsWith('4');
      const isExpense = bal.code.startsWith('5');

      if (!isRevenue && !isExpense) continue;

      const netBalance = bal.credit.sub(bal.debit); // دائن - مدين

      if (netBalance.isZero()) continue;

      if (isRevenue) {
        // الإيرادات طبيعتها دائنة، لتصفيرها نجعلها مدينة
        totalRevenue = totalRevenue.add(netBalance);
        closingLines.push({
          accountId,
          debit: netBalance.abs(),
          credit: new Decimal(0),
          description: `إقفال حساب الإيراد ${bal.name} للسنة المالية ${fiscalYear}`,
        });
      } else if (isExpense) {
        // المصاريف طبيعتها مدينة، لتصفيرها نجعلها دائنة
        totalExpense = totalExpense.add(netBalance.neg());
        closingLines.push({
          accountId,
          debit: new Decimal(0),
          credit: netBalance.abs(),
          description: `إقفال حساب المصروف ${bal.name} للسنة المالية ${fiscalYear}`,
        });
      }
    }

    const netIncome = totalRevenue.sub(totalExpense);

    if (closingLines.length === 0) {
      throw new Error('لا توجد أرصدة نشطة في حسابات الإيرادات أو المصاريف لإقفالها.');
    }

    // إضافة سطر الأرباح المحتجزة المتوازن
    if (!netIncome.isZero()) {
      closingLines.push({
        accountId: retainedEarningsAccountId,
        debit: netIncome.isPositive() ? new Decimal(0) : netIncome.abs(),
        credit: netIncome.isPositive() ? netIncome.abs() : new Decimal(0),
        description: `ترحيل صافي الأرباح/الخسائر للسنة المالية ${fiscalYear} إلى الأرباح المحتجزة`,
      });
    }

    // إنشاء قيد الإقفال السنوي داخل transaction
    const journalEntry = await prisma.$transaction(async (tx: any) => {
      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          entryNumber: `JE-YEC-${fiscalYear}-${Date.now()}`,
          entryDate: `${fiscalYear}-12-31T23:59:59.000Z`,
          description: `قيد الإقفال السنوي المجمع للسنة المالية ${fiscalYear}`,
          status: 'POSTED',
          createdBy: parseInt(userId, 10) || 0,
          lines: {
            create: closingLines.map(line => ({
              tenantId,
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              description: line.description,
            })),
          },
        },
      });

      return je;
    });

    log.info(`Year-end closing journal entry posted successfully for year ${fiscalYear}`, { tenantId, journalEntryId: journalEntry.id });

    return {
      success: true,
      journalEntryId: journalEntry.id,
      totalRevenue,
      totalExpense,
      netIncome,
    };
  }

  /**
   * 3. تدوير وترحيل الأرصدة الافتتاحية للسنة الجديدة (Opening Balances Rollover)
   * تدوير حسابات الأصول (1xxx)، الالتزامات (2xxx)، وحقوق الملكية (3xxx) فقط.
   */
  static async rolloverOpeningBalances({
    tenantId,
    fromFiscalYear,
    toFiscalYear,
    userId,
  }: {
    tenantId: string;
    fromFiscalYear: string;
    toFiscalYear: string;
    userId: string;
  }): Promise<{ success: boolean; openingBalancesCount: number }> {
    // حساب أرصدة الميزانية العمومية المنتهية في 31-12 للعام السابق
    const journalLines = await (prisma as any).journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            lte: `${fromFiscalYear}-12-31T23:59:59.999Z`,
          },
          status: 'POSTED',
        },
      },
      include: {
        account: true,
      },
    });

    const balances: Record<number, { code: string; name: string; debit: Decimal; credit: Decimal }> = {};

    for (const line of journalLines) {
      const accountId = line.accountId;
      const accountCode = line.account.code;
      const accountName = line.account.name;

      if (!balances[accountId]) {
        balances[accountId] = {
          code: accountCode,
          name: accountName,
          debit: new Decimal(0),
          credit: new Decimal(0),
        };
      }

      balances[accountId].debit = balances[accountId].debit.add(line.debit);
      balances[accountId].credit = balances[accountId].credit.add(line.credit);
    }

    const openingLines: any[] = [];

    for (const [accountIdStr, bal] of Object.entries(balances)) {
      const accountId = parseInt(accountIdStr, 10);
      const isBalanceSheet = bal.code.startsWith('1') || bal.code.startsWith('2') || bal.code.startsWith('3');

      if (!isBalanceSheet) continue;

      const netBalance = bal.debit.sub(bal.credit); // مدين - دائن

      if (netBalance.isZero()) continue;

      openingLines.push({
        accountId,
        debit: netBalance.isPositive() ? netBalance.abs() : new Decimal(0),
        credit: netBalance.isNegative() ? netBalance.abs() : new Decimal(0),
        description: `رصيد افتتاحي مدور للحساب ${bal.name} من السنة المالية ${fromFiscalYear}`,
      });
    }

    if (openingLines.length === 0) {
      throw new Error('لا توجد أرصدة ميزانية عمومية لترحيلها وتدويرها.');
    }

    // إنشاء قيد الأرصدة الافتتاحية في اليوم الأول من العام الجديد
    await prisma.$transaction(async (tx: any) => {
      await tx.journalEntry.create({
        data: {
          tenantId,
          entryNumber: `JE-OPB-${toFiscalYear}-${Date.now()}`,
          entryDate: `${toFiscalYear}-01-01T00:00:00.000Z`,
          description: `قيد الأرصدة الافتتاحية المدورة للسنة المالية ${toFiscalYear}`,
          status: 'POSTED',
          createdBy: parseInt(userId, 10) || 0,
          lines: {
            create: openingLines.map(line => ({
              tenantId,
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              description: line.description,
            })),
          },
        },
      });
    });

    log.info(`Opening balances rolled over successfully from ${fromFiscalYear} to ${toFiscalYear}`, { tenantId });

    return {
      success: true,
      openingBalancesCount: openingLines.length,
    };
  }
}
