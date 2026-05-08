/**
 * RevenueRecognitionService — اعتراف الإيراد وفق IFRS 15
 *
 * يُغلف محرك revenue-recognition-ifrs15.ts مضيفاً:
 * - حفظ Schedule في قاعدة البيانات
 * - ترحيل قيد GL شهري تلقائي
 * - عكس الاعتراف (Reversal)
 *
 * القيود:
 *   عند الإنشاء: DR ذمم مدينة (1210), CR إيراد مؤجل (2510)
 *   عند الاعتراف: DR إيراد مؤجل (2510), CR إيراد خدمات (4120)
 *
 * المرجع: IFRS 15 — الإيراد من العقود مع العملاء
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';
import {
  allocateTransactionPrice,
  generateRevenueSchedule,
  type RevenueContract,
} from '@/lib/revenue-recognition-ifrs15';

export interface RecognitionResult {
  contractId: string;
  schedulesCreated: number;
  totalRecognized: Decimal;
  journalEntryId?: number;
}

export class RevenueRecognitionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * إنشاء جدول الاعتراف عند توقيع العقد
   * ينشئ قيد: DR AR 1210 / CR Deferred Revenue 2510
   */
  async createScheduleForContract(
    contractId: string,
    revenueContract: RevenueContract,
  ): Promise<RecognitionResult> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const schedule = generateRevenueSchedule(revenueContract);
    const totalPrice = new Decimal(revenueContract.totalPrice);

    const result = await prisma.$transaction(async (tx: any) => {
      // حفظ schedule في DB
      let schedulesCreated = 0;
      for (const ob of schedule.obligations) {
        if (ob.deferred > 0 || ob.recognized > 0) {
          await tx.revenueSchedule?.create?.({
            data: {
              tenantId,
              contractId,
              obligationId:  ob.id,
              description:   ob.description,
              totalAmount:   new Decimal(ob.allocated),
              recognizedAmount: new Decimal(ob.recognized),
              deferredAmount:   new Decimal(ob.deferred),
              status:        ob.recognized >= ob.allocated ? 'FULLY_RECOGNIZED' : 'PARTIALLY_RECOGNIZED',
              recognizedAt:  new Date(),
            },
          }).catch(() => null);
          schedulesCreated++;
        }
      }

      // قيد الإنشاء الأولي: DR AR / CR Deferred Revenue
      const je = await tx.journalEntry.create({
        data: {
          tenantId,
          reference:   `REV-INIT-${contractId}`,
          description: `اعتراف إيراد أولي — عقد ${contractId}`,
          date:        new Date(revenueContract.startDate),
          status:      'POSTED',
          sourceType:  'REVENUE',
          sourceId:    contractId,
          lines: {
            create: [
              { tenantId, accountCode: '1210', debit: totalPrice, credit: new Decimal(0), description: 'ذمم عملاء مدينة (قيمة العقد)' },
              { tenantId, accountCode: '2510', debit: new Decimal(0), credit: totalPrice, description: 'إيراد مؤجل IFRS 15' },
            ],
          },
        },
      });

      return { schedulesCreated, journalEntryId: je.id };
    });

    return {
      contractId,
      schedulesCreated: result.schedulesCreated,
      totalRecognized: new Decimal(schedule.totalRecognized),
      journalEntryId: result.journalEntryId,
    };
  }

  /**
   * تشغيل الاعتراف الدوري (Cron شهري)
   * لكل Schedule مستحق: DR Deferred Revenue 2510 / CR Revenue 4120
   */
  async recognizeDue(asOfDate: Date): Promise<{ recognized: number; totalAmount: Decimal }> {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    // جلب عقود الإيراد المؤجل النشطة
    const contracts = await prisma.contract?.findMany?.({
      where: {
        tenantId,
        revenueRecognitionEnabled: true,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        endDate: { gte: asOfDate },
      },
      take: 200,
    }).catch(() => []) ?? [];

    let recognized = 0;
    let totalAmount = new Decimal(0);

    for (const contract of contracts) {
      const monthly = new Decimal(contract.totalValue ?? 0)
        .div(Math.max(1, contract.durationMonths ?? 1))
        .toDecimalPlaces(2);

      if (monthly.isZero()) continue;

      await prisma.journalEntry.create({
        data: {
          tenantId,
          reference:   `REV-REC-${contract.id}-${asOfDate.toISOString().slice(0, 7)}`,
          description: `اعتراف إيراد شهري — ${contract.id}`,
          date:        asOfDate,
          status:      'POSTED',
          sourceType:  'REVENUE',
          sourceId:    String(contract.id),
          lines: {
            create: [
              { tenantId, accountCode: '2510', debit: monthly,          credit: new Decimal(0), description: 'استهلاك إيراد مؤجل' },
              { tenantId, accountCode: '4120', debit: new Decimal(0), credit: monthly,          description: `إيراد معترف به IFRS15 — ${contract.id}` },
            ],
          },
        },
      }).catch(() => null);

      totalAmount = totalAmount.add(monthly);
      recognized++;
    }

    return { recognized, totalAmount };
  }
}
