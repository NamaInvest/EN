import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'period-close' });

export class PeriodCloseEngine {

    /**
     * Initialize closing for a period by generating checklist from templates
     */
    static async startClosing(fiscalPeriodId: number) {
        const period = await prisma.fiscalPeriod.findUnique({ where: { id: fiscalPeriodId } });
        if (!period) throw new Error("Fiscal Period not found");
        if (period.status === 'closed' || period.status === 'locked') {
            throw new Error("Period is already closed or locked");
        }

        const templates = await prisma.periodCloseTaskTemplate.findMany({
            take: 100, orderBy: { sequence: 'asc' } });
        
        const checklists = await Promise.all(
            templates.map(tmpl => prisma.periodCloseChecklist.create({
                data: {
                    fiscalPeriodId,
                    taskName: tmpl.name,
                    sequence: tmpl.sequence,
                    status: 'PENDING',
                }
            }))
        );

        return checklists;
    }

    /**
     * Complete a checklist task
     */
    static async completeTask(taskId: number, ownerEmail: string, notes?: string) {
        return prisma.periodCloseChecklist.update({
            where: { id: taskId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                owner: ownerEmail,
                notes
            }
        });
    }

    /**
     * Soft Close: Prevent normal sub-ledger entries but allow adjusting GL entries
     * ─────────────────────────────────────────────────────────────────────────
     * [SOCPA & IFRS Alignment]
     * يُغلق الفترة جزئياً بحيث يمنع المعاملات العادية للموديولات الفرعية (Sales, Purchases, etc.)
     * مع التحديث المتزامن لجدول FinancialPeriod والوحدات التابعة له إلى SOFT_LOCKED لضمان حظر الكتابة الفعلي.
     */
    static async softClose(fiscalPeriodId: number, actionBy: string) {
        const period = await prisma.fiscalPeriod.findUnique({ 
            where: { id: fiscalPeriodId },
            include: { periodCloseChecklists: true }
        });

        if (!period) throw new Error("Fiscal Period not found");

        // Ensure all mandatory tasks are completed
        const pending = period.periodCloseChecklists.filter(t => t.status !== 'COMPLETED' && t.status !== 'SKIPPED');
        if (pending && pending.length > 0) {
            throw new Error("Cannot soft-close: there are pending checklist tasks.");
        }

        const periodStr = `${period.year}-${String(period.month).padStart(2, '0')}`;
        const tenantId = period.tenantId || 'default';
        const modules = ['sales', 'purchases', 'inventory', 'treasury', 'gl', 'fixed_assets', 'payroll', 'tax'];

        // تنفيذ كافه عمليات التحديث داخل بيئة معاملات موحدة لضمان الذرية (Atomic Transaction)
        await prisma.$transaction(async (tx) => {
            // 1. تحديث حالة الفترة المالية القديمة
            await tx.fiscalPeriod.update({
                where: { id: fiscalPeriodId },
                data: { status: 'closed' }
            });

            // 2. تسجيل العملية في سجل الإقفال
            await tx.periodLockLog.create({
                data: {
                    fiscalPeriodId,
                    action: 'SOFT_CLOSE',
                    actionBy
                }
            });

            // 3. تحديث أو إنشاء قفل الفترة الرئيسي لـ FinancialPeriod
            await (tx as any).financialPeriod.upsert({
                where: { tenantId_period: { tenantId, period: periodStr } },
                create: {
                    tenantId,
                    period: periodStr,
                    status: 'SOFT_LOCKED',
                    lockedBy: actionBy,
                    lockedAt: new Date()
                },
                update: {
                    status: 'SOFT_LOCKED',
                    lockedBy: actionBy,
                    lockedAt: new Date()
                }
            });

            // 4. تحديث أو إنشاء أقفال الموديولات التابعة
            for (const module of modules) {
                await (tx as any).financialPeriodModuleLock.upsert({
                    where: { tenantId_period_module: { tenantId, period: periodStr, module } },
                    create: {
                        tenantId,
                        period: periodStr,
                        module,
                        status: 'SOFT_LOCKED',
                        lockedBy: actionBy,
                        lockedAt: new Date()
                    },
                    update: {
                        status: 'SOFT_LOCKED',
                        lockedBy: actionBy,
                        lockedAt: new Date()
                    }
                });
            }
        });
        
        return true;
    }

    /**
     * Hard Close: Completely lock the period, NO entries allowed
     * ─────────────────────────────────────────────────────────────────────────
     * [SOCPA & IFRS Alignment]
     * يُقفل الفترة بالكامل وبشكل نهائي، حيث يُمنع إنشاء أو تعديل أي قيد محاسبي أو معاملة تجارية.
     * مع التحديث المتزامن لجدول FinancialPeriod والوحدات التابعة له إلى HARD_LOCKED لضمان الحظر الصارم.
     */
    static async hardClose(fiscalPeriodId: number, actionBy: string) {
        const period = await prisma.fiscalPeriod.findUnique({ 
            where: { id: fiscalPeriodId }
        });
        if (!period) throw new Error("Fiscal Period not found");

        const periodStr = `${period.year}-${String(period.month).padStart(2, '0')}`;
        const tenantId = period.tenantId || 'default';
        const modules = ['sales', 'purchases', 'inventory', 'treasury', 'gl', 'fixed_assets', 'payroll', 'tax'];

        await prisma.$transaction(async (tx) => {
            // 1. تحديث حالة الفترة المالية القديمة إلى locked
            await tx.fiscalPeriod.update({
                where: { id: fiscalPeriodId },
                data: { 
                    status: 'locked',
                    closedAt: new Date(),
                    closedBy: parseInt(actionBy) || null 
                }
            });

            // 2. تسجيل العملية في سجل الإقفال
            await tx.periodLockLog.create({
                data: {
                    fiscalPeriodId,
                    action: 'HARD_CLOSE',
                    actionBy
                }
            });

            // 3. تحديث أو إنشاء قفل الفترة الرئيسي لـ FinancialPeriod إلى HARD_LOCKED
            await (tx as any).financialPeriod.upsert({
                where: { tenantId_period: { tenantId, period: periodStr } },
                create: {
                    tenantId,
                    period: periodStr,
                    status: 'HARD_LOCKED',
                    lockedBy: actionBy,
                    lockedAt: new Date()
                },
                update: {
                    status: 'HARD_LOCKED',
                    lockedBy: actionBy,
                    lockedAt: new Date()
                }
            });

            // 4. تحديث أو إنشاء أقفال الموديولات التابعة لـ HARD_LOCKED
            for (const module of modules) {
                await (tx as any).financialPeriodModuleLock.upsert({
                    where: { tenantId_period_module: { tenantId, period: periodStr, module } },
                    create: {
                        tenantId,
                        period: periodStr,
                        module,
                        status: 'HARD_LOCKED',
                        lockedBy: actionBy,
                        lockedAt: new Date()
                    },
                    update: {
                        status: 'HARD_LOCKED',
                        lockedBy: actionBy,
                        lockedAt: new Date()
                    }
                });
            }
        });
        return true;
    }

    /**
     * Reopen a period (Requires Admin Privileges ideally checked before calling)
     * ─────────────────────────────────────────────────────────────────────────
     * [SOCPA & IFRS Alignment]
     * يُعيد فتح فترة مقفلة مسبقاً بناءً على طلب إداري مصحوباً بمبرر عمل مدون.
     * مع التحديث المتزامن لجدول FinancialPeriod والوحدات التابعة له إلى OPEN لإتاحة العمليات مجدداً.
     */
    static async reopen(fiscalPeriodId: number, actionBy: string, reason: string) {
        const period = await prisma.fiscalPeriod.findUnique({ 
            where: { id: fiscalPeriodId }
        });
        if (!period) throw new Error("Fiscal Period not found");

        const periodStr = `${period.year}-${String(period.month).padStart(2, '0')}`;
        const tenantId = period.tenantId || 'default';
        const modules = ['sales', 'purchases', 'inventory', 'treasury', 'gl', 'fixed_assets', 'payroll', 'tax'];

        await prisma.$transaction(async (tx) => {
            // 1. تحديث حالة الفترة المالية القديمة إلى open
            await tx.fiscalPeriod.update({
                where: { id: fiscalPeriodId },
                data: { status: 'open', closedAt: null, closedBy: null }
            });

            // 2. تسجيل العملية في سجل إعادة الفتح مع السبب
            await tx.periodLockLog.create({
                data: {
                    fiscalPeriodId,
                    action: 'REOPEN',
                    actionBy,
                    reason
                }
            });

            // 3. إعادة فتح الفترة الرئيسية لـ FinancialPeriod
            await (tx as any).financialPeriod.upsert({
                where: { tenantId_period: { tenantId, period: periodStr } },
                create: {
                    tenantId,
                    period: periodStr,
                    status: 'OPEN',
                    reopenedBy: actionBy,
                    reopenedAt: new Date(),
                    reason
                },
                update: {
                    status: 'OPEN',
                    reopenedBy: actionBy,
                    reopenedAt: new Date(),
                    reason
                }
            });

            // 4. إعادة فتح كافة أقفال الموديولات التابعة
            for (const module of modules) {
                await (tx as any).financialPeriodModuleLock.upsert({
                    where: { tenantId_period_module: { tenantId, period: periodStr, module } },
                    create: {
                        tenantId,
                        period: periodStr,
                        module,
                        status: 'OPEN',
                        reason
                    },
                    update: {
                        status: 'OPEN',
                        reason
                    }
                });
            }
        });
        return true;
    }
}
