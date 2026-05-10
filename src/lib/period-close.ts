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
     */
    static async softClose(fiscalPeriodId: number, actionBy: string) {
        const period = await prisma.fiscalPeriod.findUnique({ 
            where: { id: fiscalPeriodId },
            include: { periodCloseChecklists: true }
        });

        // Ensure all mandatory tasks are completed
        const pending = period?.periodCloseChecklists.filter(t => t.status !== 'COMPLETED' && t.status !== 'SKIPPED');
        if (pending && pending.length > 0) {
            throw new Error("Cannot soft-close: there are pending checklist tasks.");
        }

        await prisma.$transaction([
            prisma.fiscalPeriod.update({
                where: { id: fiscalPeriodId },
                data: { status: 'closed' }
            }),
            prisma.periodLockLog.create({
                data: {
                    fiscalPeriodId,
                    action: 'SOFT_CLOSE',
                    actionBy
                }
            })
        ]);
        
        return true;
    }

    /**
     * Hard Close: Completely lock the period, NO entries allowed
     */
    static async hardClose(fiscalPeriodId: number, actionBy: string) {
        await prisma.$transaction([
            prisma.fiscalPeriod.update({
                where: { id: fiscalPeriodId },
                data: { 
                    status: 'locked',
                    closedAt: new Date(),
                    closedBy: parseInt(actionBy) || null 
                }
            }),
            prisma.periodLockLog.create({
                data: {
                    fiscalPeriodId,
                    action: 'HARD_CLOSE',
                    actionBy
                }
            })
        ]);
        return true;
    }

    /**
     * Reopen a period (Requires Admin Privileges ideally checked before calling)
     */
    static async reopen(fiscalPeriodId: number, actionBy: string, reason: string) {
        await prisma.$transaction([
            prisma.fiscalPeriod.update({
                where: { id: fiscalPeriodId },
                data: { status: 'open', closedAt: null, closedBy: null }
            }),
            prisma.periodLockLog.create({
                data: {
                    fiscalPeriodId,
                    action: 'REOPEN',
                    actionBy,
                    reason
                }
            })
        ]);
        return true;
    }
}
