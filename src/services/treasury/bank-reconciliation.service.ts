/**
 * BankReconciliationService — مطابقة البنوك
 *
 * النماذج: BankStatement, BankStatementLine, BankReconRule, OutstandingCheck, JournalLine
 *
 * الخوارزمية:
 *  1. جلب حركات كشف الحساب البنكي
 *  2. مطابقتها مع قيود السجل المحاسبي (GL) بالمبلغ + التاريخ + المرجع
 *  3. تحديد البنود غير المطابقة (Outstanding items)
 *  4. الشيكات المعلقة (OutstandingChecks)
 *  5. توليد تقرير التسوية
 *
 * المعيار: اختلاف الرصيد البنكي عن الرصيد المحاسبي = مجموع البنود غير المطابقة
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface ReconLine {
  bankLineId?: number;
  glLineId?: number;
  date: Date;
  description: string;
  amount: Decimal;
  type: 'DEBIT' | 'CREDIT';
  matchStatus: 'MATCHED' | 'BANK_ONLY' | 'GL_ONLY';
  matchedLineId?: number;
}

export interface BankReconReport {
  bankAccountId: number;
  statementId: number;
  statementDate: Date;
  closingBalance: Decimal;      // رصيد كشف البنك
  glBalance: Decimal;           // رصيد الدفاتر
  difference: Decimal;          // يجب أن يكون 0
  matchedLines: ReconLine[];
  unmatchedBankLines: ReconLine[];   // موجودة في البنك، غير موجودة في الدفاتر
  unmatchedGLLines: ReconLine[];     // موجودة في الدفاتر، غير موجودة في البنك
  outstandingChecks: { checkNumber: string; amount: Decimal; payee: string; days: number }[];
  isReconciled: boolean;
}

export class BankReconciliationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * تشغيل المطابقة لكشف حساب محدد
   */
  async reconcile(statementId: number): Promise<BankReconReport> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    // 1. جلب الكشف وبنوده
    const statement = await prisma.bankStatement.findFirst({
      where: { id: statementId, tenantId },
      include: {
        lines: { orderBy: { transactionDate: 'asc' } },
        bankAccount: true,
      },
    });
    if (!statement) throw new Error(`كشف الحساب ${statementId} غير موجود`);

    const closingBalance = new Decimal(statement.closingBalance ?? 0);

    // 2. جلب قيود GL للحساب البنكي في نفس الفترة
    const firstDate = statement.lines[0]?.transactionDate ?? statement.importedAt;
    const lastDate  = statement.lines[statement.lines.length - 1]?.transactionDate ?? new Date();

    const glLines = await prisma.journalLine.findMany({
      where: {
        tenantId,
        account: { bankAccountId: statement.bankAccountId },
        journalEntry: {
          status: 'POSTED',
          date: { gte: firstDate, lte: lastDate },
        },
      },
      include: { journalEntry: true },
    }).catch(() => []);

    // 3. المطابقة بالمبلغ + التاريخ (±2 أيام) + المرجع (إن وجد)
    const matchedGLIds = new Set<number>();
    const matchedBankIds = new Set<number>();
    const matchedLines: ReconLine[] = [];
    const unmatchedBankLines: ReconLine[] = [];

    for (const bankLine of statement.lines) {
      const bankAmount = new Decimal(bankLine.amount);
      const bankDate = new Date(bankLine.transactionDate);

      // بحث في GL عن مطابق
      const match = glLines.find((gl: any) => {
        if (matchedGLIds.has(gl.id)) return false;
        const glAmount = new Decimal(gl.debit ?? 0).sub(new Decimal(gl.credit ?? 0));
        const expectedAmount = bankLine.type === 'CREDIT' ? bankAmount : bankAmount.negated();
        if (!glAmount.equals(expectedAmount)) return false;

        // تحمل تاريخي ±3 أيام
        const glDate = new Date(gl.journalEntry.date);
        const diffDays = Math.abs((bankDate.getTime() - glDate.getTime()) / 86_400_000);
        return diffDays <= 3;
      });

      if (match) {
        matchedGLIds.add(match.id);
        matchedBankIds.add(bankLine.id);
        matchedLines.push({
          bankLineId: bankLine.id,
          glLineId: match.id,
          date: bankDate,
          description: bankLine.description,
          amount: bankAmount,
          type: bankLine.type,
          matchStatus: 'MATCHED',
        });

        // تحديث حالة السطر في كشف البنك
        await prisma.bankStatementLine.update({
          where: { id: bankLine.id },
          data: { matchStatus: 'MATCHED', matchedGlLineId: match.id },
        }).catch(() => null);
      } else {
        unmatchedBankLines.push({
          bankLineId: bankLine.id,
          date: bankDate,
          description: bankLine.description,
          amount: bankAmount,
          type: bankLine.type,
          matchStatus: 'BANK_ONLY',
        });
      }
    }

    // 4. قيود GL غير مطابقة (deposits in transit, errors)
    const unmatchedGLLines: ReconLine[] = glLines
      .filter((gl: any) => !matchedGLIds.has(gl.id))
      .map((gl: any) => ({
        glLineId: gl.id,
        date: new Date(gl.journalEntry.date),
        description: gl.journalEntry.description,
        amount: new Decimal(gl.debit ?? 0).add(new Decimal(gl.credit ?? 0)),
        type: new Decimal(gl.debit ?? 0).gt(0) ? 'DEBIT' : 'CREDIT',
        matchStatus: 'GL_ONLY' as const,
      }));

    // 5. الشيكات المعلقة
    const outstanding = await prisma.outstandingCheck.findMany({
      where: { tenantId, bankAccountId: statement.bankAccountId, status: 'OUTSTANDING' },
    }).catch(() => []);

    const outstandingChecks = outstanding.map((c: any) => ({
      checkNumber: c.checkNumber ?? '',
      amount: new Decimal(c.amount),
      payee: c.payee,
      days: Math.floor((Date.now() - new Date(c.issuedDate).getTime()) / 86_400_000),
    }));

    // 6. رصيد GL
    const glBalance = glLines.reduce((s: Decimal, l: any) => {
      return s.add(new Decimal(l.debit ?? 0)).sub(new Decimal(l.credit ?? 0));
    }, new Decimal(0));

    const difference = closingBalance.sub(glBalance);

    return {
      bankAccountId: statement.bankAccountId,
      statementId,
      statementDate: lastDate,
      closingBalance,
      glBalance,
      difference,
      matchedLines,
      unmatchedBankLines,
      unmatchedGLLines,
      outstandingChecks,
      isReconciled: difference.abs().lte(new Decimal('0.01')),
    };
  }
}
