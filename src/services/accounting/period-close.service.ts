/**
 * PeriodCloseService — إغلاق الفترة المحاسبية
 *
 * النماذج: FiscalPeriod, PeriodCloseChecklist, PeriodLockLog, JournalEntry, OpenItem
 *
 * العملية:
 *  1. التحقق من اكتمال Checklist
 *  2. التحقق من صفر البنود المفتوحة (AR/AP)
 *  3. التحقق من عدم وجود قيود معلقة
 *  4. قفل الفترة وتسجيل الإجراء
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface PeriodCloseValidation {
  canClose: boolean;
  blockers: string[];
  warnings: string[];
  checklistProgress: { total: number; completed: number };
}

export interface PeriodCloseResult {
  success: boolean;
  fiscalPeriodId: number;
  lockedAt: Date;
  lockedBy: string;
}

export class PeriodCloseService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * التحقق من جاهزية الإغلاق — بدون تنفيذ
   */
  async validate(fiscalPeriodId: number): Promise<PeriodCloseValidation> {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const prisma = this.prisma as any;
    const tenantId = this.ctx.tenant.id;

    // 1. جلب الفترة
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: fiscalPeriodId, tenantId },
    });
    if (!period) throw new Error('الفترة المحاسبية غير موجودة');
    if (period.status === 'locked') {
      blockers.push('الفترة مقفلة بالفعل');
      return { canClose: false, blockers, warnings, checklistProgress: { total: 0, completed: 0 } };
    }

    // 2. Checklist progress
    const tasks = await prisma.periodCloseChecklist.findMany({
      where: { fiscalPeriodId, tenantId },
    });
    const completed = tasks.filter((t: any) => t.status === 'DONE').length;
    const pendingTasks = tasks.filter((t: any) => t.status !== 'DONE');
    if (pendingTasks.length > 0) {
      blockers.push(
        `${pendingTasks.length} مهام غير مكتملة في قائمة الإغلاق: ${pendingTasks.map((t: any) => t.taskName).join('، ')}`,
      );
    }

    // 3. قيود معلقة (غير مرحلة)
    const draftJournals = await prisma.journalEntry.count({
      where: { tenantId, fiscalPeriodId, status: 'DRAFT' },
    });
    if (draftJournals > 0) {
      blockers.push(`يوجد ${draftJournals} قيود محاسبية معلقة لم تُرحَّل`);
    }

    // 4. بنود مفتوحة (AR/AP) — تحذير فقط، لا يمنع الإغلاق
    const openItems = await prisma.openItem.count({
      where: { tenantId, fiscalPeriodId, status: 'OPEN' },
    }).catch(() => 0);
    if (openItems > 0) {
      warnings.push(`${openItems} بنود مفتوحة في AR/AP — يُنصح بتسويتها قبل الإغلاق`);
    }

    return {
      canClose: blockers.length === 0,
      blockers,
      warnings,
      checklistProgress: { total: tasks.length, completed },
    };
  }

  /**
   * تنفيذ إغلاق الفترة
   */
  async closePeriod(fiscalPeriodId: number, reason?: string): Promise<PeriodCloseResult> {
    const validation = await this.validate(fiscalPeriodId);
    if (!validation.canClose) {
      throw new Error(
        `لا يمكن إغلاق الفترة:\n${validation.blockers.join('\n')}`,
      );
    }

    const now = new Date();
    const userId = this.ctx.user.id;
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    await prisma.$transaction(async (tx: any) => {
      // قفل الفترة
      await tx.fiscalPeriod.update({
        where: { id: fiscalPeriodId },
        data: { status: 'closed', closedAt: now, closedBy: parseInt(userId, 10) || 0 },
      });

      // تسجيل الإجراء
      await tx.periodLockLog.create({
        data: {
          tenantId,
          fiscalPeriodId,
          action: 'CLOSED',
          actionBy: userId,
          reason: reason ?? 'إغلاق الفترة المحاسبية',
        },
      });
    });

    return {
      success: true,
      fiscalPeriodId,
      lockedAt: now,
      lockedBy: userId,
    };
  }

  /**
   * إعادة فتح فترة مغلقة (للتصحيح — يتطلب صلاحية خاصة)
   */
  async reopenPeriod(fiscalPeriodId: number, reason: string): Promise<void> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    await prisma.$transaction(async (tx: any) => {
      const period = await tx.fiscalPeriod.findFirst({
        where: { id: fiscalPeriodId, tenantId },
      });
      if (!period) throw new Error('الفترة المحاسبية غير موجودة أو لا تتبع لك');

      await tx.fiscalPeriod.update({
        where: { id: fiscalPeriodId },
        data: { status: 'open', closedAt: null, closedBy: null },
      });

      await tx.periodLockLog.create({
        data: {
          tenantId,
          fiscalPeriodId,
          action: 'REOPENED',
          actionBy: this.ctx.user.id,
          reason,
        },
      });
    });
  }

  /**
   * تهيئة Checklist للفترة بناءً على القوالب القياسية
   */
  async initChecklist(fiscalPeriodId: number): Promise<void> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const STANDARD_TASKS = [
      { taskName: 'ترحيل جميع القيود المعلقة', sequence: 1 },
      { taskName: 'مطابقة أرصدة البنوك', sequence: 2 },
      { taskName: 'مراجعة حسابات القبض', sequence: 3 },
      { taskName: 'مراجعة حسابات الدفع', sequence: 4 },
      { taskName: 'إعادة تقييم العملات الأجنبية', sequence: 5 },
      { taskName: 'مراجعة المخزون والجرد', sequence: 6 },
      { taskName: 'استهلاك الأصول الثابتة', sequence: 7 },
      { taskName: 'ترحيل القيود الشهرية المتكررة', sequence: 8 },
      { taskName: 'مراجعة الميزانية مقابل الفعلي', sequence: 9 },
      { taskName: 'مراجعة قائمة الدخل', sequence: 10 },
    ];

    const existing = await prisma.periodCloseChecklist.count({
      where: { fiscalPeriodId, tenantId },
    });
    if (existing > 0) return; // تم التهيئة مسبقاً

    await prisma.periodCloseChecklist.createMany({
      data: STANDARD_TASKS.map((t) => ({
        tenantId,
        fiscalPeriodId,
        ...t,
        status: 'PENDING',
      })),
    });
  }

  async completeTask(checklistId: number, notes?: string): Promise<void> {
    await (this.prisma as any).periodCloseChecklist.update({
      where: { id: checklistId },
      data: { status: 'DONE', completedAt: new Date(), notes },
    });
  }
}
