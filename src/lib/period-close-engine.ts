/**
 * Period Close Engine — Adapter
 * Bridges the period-close API route to the PeriodCloseEngine class
 * and adds a full 14-step SOCPA checklist.
 */

import { PrismaClient } from '@prisma/client';
import { PeriodCloseEngine } from './period-close';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'period-close-engine' });

// ─── SOCPA 14-Step Standard Checklist ─────────────────────────────────────────
export const SOCPA_CLOSE_STEPS = [
  { code: 'BANK_RECON',     nameAr: 'تسوية الحسابات البنكية',           sequence: 1 },
  { code: 'AR_SUBLEDGER',   nameAr: 'تسوية دفتر الأستاذ المساعد AR',   sequence: 2 },
  { code: 'AP_SUBLEDGER',   nameAr: 'تسوية دفتر الأستاذ المساعد AP',   sequence: 3 },
  { code: 'INVENTORY',      nameAr: 'التحقق من أرصدة المخزون',          sequence: 4 },
  { code: 'FIXED_ASSETS',   nameAr: 'حساب استهلاك الأصول الثابتة',     sequence: 5 },
  { code: 'ACCRUALS',       nameAr: 'قيود الاستحقاقات',                  sequence: 6 },
  { code: 'PREPAYMENTS',    nameAr: 'توزيع المدفوعات المقدمة',           sequence: 7 },
  { code: 'FX_REVAL',       nameAr: 'إعادة تقييم العملات الأجنبية',     sequence: 8 },
  { code: 'VAT_RECON',      nameAr: 'تسوية ضريبة القيمة المضافة',       sequence: 9 },
  { code: 'PAYROLL',        nameAr: 'استحقاقات الرواتب والأجور',        sequence: 10 },
  { code: 'INTERCOMPANY',   nameAr: 'إلغاء الأرصدة بين الشركات',        sequence: 11 },
  { code: 'TRIAL_BALANCE',  nameAr: 'مراجعة ميزان المراجعة',             sequence: 12 },
  { code: 'CLOSING_JES',    nameAr: 'قيود الإغلاق',                      sequence: 13 },
  { code: 'RETAINED_EARN',  nameAr: 'ترحيل الأرباح المحتجزة',           sequence: 14 },
] as const;

export type StepCode = typeof SOCPA_CLOSE_STEPS[number]['code'];

// ─── Public functions used by the API route ────────────────────────────────────

/**
 * Initialize period close tasks from the SOCPA checklist template.
 * Creates one PeriodCloseChecklist record per step if not already initialized.
 */
export async function initPeriodCloseTasks(
  prisma: PrismaClient,
  periodId: number,
  tenantId: string
): Promise<number> {
  // Check if tasks already exist
  const existing = await (prisma as any).periodCloseChecklist.count({
    where: { fiscalPeriodId: periodId, tenantId },
  });
  if (existing > 0) return existing;

  // Ensure template records exist cleanly (using safe non-unique index find/create)
  for (const step of SOCPA_CLOSE_STEPS) {
    try {
      const templateExists = await (prisma as any).periodCloseTaskTemplate.findFirst({
        where: { name: step.nameAr, tenantId }
      });
      if (!templateExists) {
        await (prisma as any).periodCloseTaskTemplate.create({
          data: {
            tenantId,
            name: step.nameAr,
            sequence: step.sequence,
            applicableModule: 'accounting',
            isMandatory: true
          }
        });
      }
    } catch (err) {
      log.error('Failed to ensure template record', { step: step.code, errorMessage: err instanceof Error ? err.message : String(err) });
    }
  }

  // Create checklist items
  const checklists = await (prisma as any).periodCloseChecklist.createMany({
    data: SOCPA_CLOSE_STEPS.map((step) => ({
      tenantId,
      fiscalPeriodId: periodId,
      taskName:       step.nameAr,
      sequence:       step.sequence,
      status:         'PENDING',
    })),
    skipDuplicates: true,
  });

  return checklists.count;
}

/**
 * Mark a specific task as completed.
 */
export async function completeTask(
  prisma:    PrismaClient,
  periodId:  number,
  taskCode:  string,
  userId:    string,
  notes?:    string,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const step = SOCPA_CLOSE_STEPS.find(s => s.code === taskCode);
    const nameToMatch = step ? step.nameAr : taskCode;

    const whereClause: any = { fiscalPeriodId: periodId, taskName: nameToMatch };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    await (prisma as any).periodCloseChecklist.updateMany({
      where: whereClause,
      data: {
        status:      'COMPLETED',
        completedAt: new Date(),
        owner:       userId,
        notes,
      },
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Get full status of a period's close process.
 */
export async function getPeriodCloseStatus(
  prisma:   PrismaClient,
  periodId: number,
  tenantId?: string
): Promise<{
  period:      any;
  tasks:       any[];
  progress:    { total: number; completed: number; pending: number; skipped: number };
  readyToClose: boolean;
}> {
  const period = await (prisma as any).fiscalPeriod.findUnique({
    where: { id: periodId },
  });

  const whereClause: any = { fiscalPeriodId: periodId };
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  const tasks = await (prisma as any).periodCloseChecklist.findMany({
    where:   whereClause,
    orderBy: { sequence: 'asc' },
  });

  const tasksWithCode = tasks.map((task: any) => {
    const step = SOCPA_CLOSE_STEPS.find((s) => s.nameAr === task.taskName);
    return {
      ...task,
      taskCode: step ? step.code : task.taskName,
    };
  });

  const total     = tasksWithCode.length;
  const completed = tasksWithCode.filter((t: any) => t.status === 'COMPLETED').length;
  const skipped   = tasksWithCode.filter((t: any) => t.status === 'SKIPPED').length;
  const pending   = total - completed - skipped;

  return {
    period,
    tasks: tasksWithCode,
    progress: { total, completed, pending, skipped },
    readyToClose: pending === 0 && total > 0,
  };
}

/**
 * Execute the full soft-close sequence.
 * Validates all tasks complete before closing.
 */
export async function executeSoftClose(
  prisma:   PrismaClient,
  periodId: number,
  userId:   string
): Promise<{ success: boolean; error?: string }> {
  try {
    await PeriodCloseEngine.softClose(periodId, userId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Execute the full hard-close (lock) sequence.
 */
export async function executeHardClose(
  prisma:   PrismaClient,
  periodId: number,
  userId:   string
): Promise<{ success: boolean; error?: string }> {
  try {
    await PeriodCloseEngine.hardClose(periodId, userId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
