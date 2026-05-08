/**
 * LeaseAccountingService — تشغيل قيود IFRS 16 (ترميم LeaseAccountingEngine)
 *
 * يُضيف للمحرك الموجود الربط الحقيقي بالدفاتر المحاسبية:
 *
 * قيد الإنشاء (Inception):
 *   DR 1410  أصل حق الاستخدام (ROU)  = PV
 *   CR 2520  التزام التأجير — متداول   = (أقساط السنة القادمة)
 *   CR 2530  التزام التأجير — غير متداول = (الباقي)
 *
 * القيد الشهري (Per schedule line):
 *   DR 5410  مصروف الفائدة            = interestExpense
 *   DR 2520  التزام التأجير (متداول)   = principalReduction
 *   CR 1112  البنك                    = payment
 *   DR 5220  مصروف الاستهلاك (ROU)    = rouDepreciation
 *   CR 1410  أصل حق الاستخدام (مراكم)= rouDepreciation
 *
 * المرجع: IFRS 16 — عقود الإيجار
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';
import { LeaseAccountingEngine } from '@/lib/lease-accounting-engine';

export interface LeaseInceptionResult {
  contractId: number;
  pv: number;
  schedulesCount: number;
  journalEntryId?: number;
}

export interface LeaseMonthlyResult {
  processed: number;
  totalPayment: Decimal;
  totalInterest: Decimal;
  errors: string[];
}

export class LeaseAccountingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * الإنشاء الأولي — ينشئ الـ Schedule + قيد GL
   */
  async recognizeLeaseWithGL(contractId: number): Promise<LeaseInceptionResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    // احسب PV + Schedule عبر المحرك الموجود
    const base = await LeaseAccountingEngine.recognizeLease(contractId, 0);
    const pv   = new Decimal(base.pv);

    // حساب الجزء المتداول (قسط السنة القادمة)
    const schedules = await prisma.leaseAmortizationSchedule.findMany({
      where: { contractId },
      orderBy: { periodNumber: 'asc' },
      take: 12,
    }).catch(() => []);

    const currentPortionTotal = schedules.reduce(
      (s: Decimal, r: any) => s.add(new Decimal(r.principalReduction ?? 0)),
      new Decimal(0),
    ).toDecimalPlaces(2);

    const nonCurrentPortionTotal = pv.sub(currentPortionTotal).toDecimalPlaces(2);

    const je = await prisma.journalEntry.create({
      data: {
        tenantId,
        reference:   `LEASE-INIT-${contractId}`,
        description: `إنشاء عقد إيجار IFRS 16 — ${contractId}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'LEASE',
        sourceId:    contractId,
        lines: {
          create: [
            { tenantId, accountCode: '1410', debit: pv,                     credit: new Decimal(0),          description: 'أصل حق الاستخدام (ROU Asset)' },
            { tenantId, accountCode: '2520', debit: new Decimal(0),          credit: currentPortionTotal,     description: 'التزام تأجير — الجزء المتداول' },
            { tenantId, accountCode: '2530', debit: new Decimal(0),          credit: nonCurrentPortionTotal,  description: 'التزام تأجير — الجزء غير المتداول' },
          ].filter(l => l.debit.gt(0) || l.credit.gt(0)),
        },
      },
    }).catch(() => null);

    return { contractId, pv: pv.toNumber(), schedulesCount: base.schedulesCount, journalEntryId: je?.id };
  }

  /**
   * الترحيل الشهري — ينفذ الدفعة + الاستهلاك لكل Schedule مستحق
   */
  async postMonthlyEntries(targetMonth: Date): Promise<LeaseMonthlyResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    const pending = await prisma.leaseAmortizationSchedule.findMany({
      where: {
        status: 'PENDING',
        paymentDate: { lte: endOfMonth },
        contract: { tenantId },
      },
      include: { contract: true },
      take: 200,
    }).catch(() => []);

    let processed    = 0;
    let totalPayment = new Decimal(0);
    let totalInterest = new Decimal(0);
    const errors: string[] = [];

    for (const sched of pending) {
      try {
        const payment      = new Decimal(sched.payment ?? 0);
        const interest     = new Decimal(sched.interestExpense ?? 0);
        const principal    = new Decimal(sched.principalReduction ?? 0);
        const rouDep       = new Decimal(sched.rouDepreciation ?? 0);

        await prisma.$transaction(async (tx: any) => {
          await tx.journalEntry.create({
            data: {
              tenantId,
              reference:   `LEASE-PAY-${sched.contractId}-${sched.periodNumber}`,
              description: `دفعة إيجار IFRS16 — قسط ${sched.periodNumber}`,
              date:        sched.paymentDate,
              status:      'POSTED',
              sourceType:  'LEASE',
              sourceId:    sched.contractId,
              lines: {
                create: [
                  // الدفعة الشهرية
                  { tenantId, accountCode: '5410', debit: interest,          credit: new Decimal(0), description: 'مصروف الفائدة على الإيجار' },
                  { tenantId, accountCode: '2520', debit: principal,         credit: new Decimal(0), description: 'سداد أصل التزام التأجير' },
                  { tenantId, accountCode: '1112', debit: new Decimal(0), credit: payment,           description: 'دفع قسط الإيجار من البنك' },
                  // استهلاك ROU
                  { tenantId, accountCode: '5220', debit: rouDep,           credit: new Decimal(0), description: 'استهلاك أصل حق الاستخدام (ROU)' },
                  { tenantId, accountCode: '1421', debit: new Decimal(0), credit: rouDep,           description: 'مجمع استهلاك أصل حق الاستخدام' },
                ].filter(l => l.debit.gt(0) || l.credit.gt(0)),
              },
            },
          });

          await tx.leaseAmortizationSchedule.update({
            where: { id: sched.id },
            data:  { status: 'POSTED' },
          });
        });

        totalPayment  = totalPayment.add(payment);
        totalInterest = totalInterest.add(interest);
        processed++;
      } catch (err: any) {
        errors.push(`Schedule ${sched.id}: ${err.message}`);
      }
    }

    return { processed, totalPayment, totalInterest, errors };
  }
}
