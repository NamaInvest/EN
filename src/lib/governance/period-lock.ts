import { prisma } from '@/lib/prisma';
import { FinancialPeriodStatus } from '@prisma/client';
import { logger } from '@/lib/observability/logger';
import { traceOverrideUsed, tracePeriodLockRejection } from '@/lib/observability/financial-trace';

const log = logger.child({ module: 'governance.period-lock' });

export class PeriodLockViolation extends Error {
  constructor(public message: string, public code: 'LOCKED' | 'MASTER_OVERRIDE_REQUIRED') {
    super(message);
    this.name = 'PeriodLockViolation';
  }
}

export interface OverrideContext {
  actorId: string;
  actorRole: string;
  tenantId: string;
  operationType: string;
  module: string;
  postingDate: Date;
  reason: string;
  confirmationCode: string;
  requestId: string;
}

export interface AssertPeriodWritableOptions {
  tenantId: string;
  postingDate: Date;
  operationType: string;
  module: string;
  actor: string;
  overrideContext?: OverrideContext;
}

/**
 * Asserts that a given financial period is open for mutations.
 * Enforces SOFT_LOCK and HARD_LOCK restrictions safely.
 * Allows MASTER_ADMIN to bypass SOFT_LOCK via overrideContext.
 */
export async function assertPeriodWritable({
  tenantId,
  postingDate,
  operationType,
  module,
  actor,
  overrideContext,
}: AssertPeriodWritableOptions): Promise<'ALLOWED' | 'ALLOWED_WITH_OVERRIDE'> {
  const year = postingDate.getFullYear();
  const month = String(postingDate.getMonth() + 1).padStart(2, '0');
  const periodStr = `${year}-${month}`;

  // 1. Check Global Period Lock first
  const globalPeriod = await prisma.financialPeriod.findUnique({
    where: {
      tenantId_period: {
        tenantId,
        period: periodStr,
      },
    },
  });

  const globalStatus = globalPeriod?.status || FinancialPeriodStatus.OPEN;

  // HARD_LOCKED global is absolute. No override allowed.
  if (globalStatus === FinancialPeriodStatus.HARD_LOCKED) {
    tracePeriodLockRejection({
      operationType,
      module,
      periodState: 'HARD_LOCKED',
      rejectionCode: 'LOCKED',
      period: periodStr,
    });
    throw new PeriodLockViolation(`الفترة المحاسبية ${periodStr} مغلقة نهائياً (CLOSED).`, 'LOCKED');
  }

  // If globally SOFT_LOCKED, verify global override first
  let isGlobalOverridden = false;
  let globalOverrideLogCreated = false;

  if (globalStatus === FinancialPeriodStatus.SOFT_LOCKED) {
    if (overrideContext) {
      const { actorRole, reason, confirmationCode, tenantId: ctxTenant, actorId } = overrideContext;
      const isRoleValid = actorRole === 'MASTER_ADMIN' || actorRole === 'SUPER_ADMIN';
      const isReasonValid = reason && reason.trim().length >= 20;
      const isCodeValid = confirmationCode === 'CONFIRM-SOFT-LOCK-OVERRIDE';
      const isTenantMatch = ctxTenant === tenantId;
      const isActorMatch = actorId && actorId.trim().length > 0;

      if (isRoleValid && isReasonValid && isCodeValid && isTenantMatch && isActorMatch) {
        isGlobalOverridden = true;
        // Audit log for global bypass
        try {
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: 'SOFT_LOCK_OVERRIDE',
              entityType: 'FinancialPeriod',
              entityId: globalPeriod?.id ? String(globalPeriod.id) : periodStr,
              userId: !isNaN(Number(actorId)) ? Number(actorId) : undefined,
              metadata: {
                module,
                operationType,
                postingDate: postingDate.toISOString(),
                reason,
                requestId: overrideContext.requestId,
                decision: 'ALLOWED_WITH_OVERRIDE',
                scope: 'GLOBAL'
              }
            }
          });
          globalOverrideLogCreated = true;
        } catch (err) {
          log.error('Failed to write global override audit log', { errorMessage: err instanceof Error ? err.message : String(err) });
        }

        traceOverrideUsed({
          operationType,
          module,
          periodState: 'SOFT_LOCKED',
          actorId,
          actorRole,
          reason: reason.slice(0, 200),
          traceId: overrideContext.requestId,
        });

        log.warn(`SOFT_LOCK bypassed via Master Override (Global)`, { tenantId, periodStr, operationType });
      }
    }

    if (!isGlobalOverridden) {
      const violationMsg = `Financial period ${periodStr} is SOFT_LOCKED globally. Operation '${operationType}' from module '${module}' is rejected.`;
      log.warn(violationMsg, { tenantId, periodStr, status: 'SOFT_LOCKED', operationType, module });

      tracePeriodLockRejection({
        operationType,
        module,
        periodState: 'SOFT_LOCKED',
        rejectionCode: 'MASTER_OVERRIDE_REQUIRED',
        period: periodStr,
      });

      try {
        await prisma.periodLockLog.create({
          data: {
            tenantId,
            action: `REJECTED_${operationType}`,
            actionBy: actor,
            reason: violationMsg,
            fiscalPeriod: {
              connectOrCreate: {
                where: { year_month: { year, month: postingDate.getMonth() + 1 } },
                create: { tenantId, year, month: postingDate.getMonth() + 1 }
              }
            }
          }
        });
      } catch (err) {
        log.error('Failed to write period lock audit log', { errorMessage: err instanceof Error ? err.message : String(err) });
      }

      throw new PeriodLockViolation(`الفترة المحاسبية ${periodStr} مقفلة جزئياً (SOFT_LOCKED) عالمياً. يتطلب تجاوز إداري (Master Override).`, 'MASTER_OVERRIDE_REQUIRED');
    }
  }

  // 2. Check Module-Specific Period Lock
  let moduleStatus: FinancialPeriodStatus = FinancialPeriodStatus.OPEN;
  let modulePeriodLock = null;

  if (module) {
    const featureFlag = await prisma.setting.findUnique({
      where: { key: 'MODULE_PERIOD_LOCK_ENABLED' }
    });
    const isModuleLockEnabled = featureFlag?.value === 'true';

    if (isModuleLockEnabled) {
      modulePeriodLock = await (prisma as any).financialPeriodModuleLock.findUnique({
        where: {
          tenantId_period_module: {
            tenantId,
            period: periodStr,
            module,
          },
        },
      });
      if (modulePeriodLock) {
        moduleStatus = modulePeriodLock.status;
      }
    }
  }

  if (moduleStatus === FinancialPeriodStatus.OPEN) {
    return isGlobalOverridden ? 'ALLOWED_WITH_OVERRIDE' : 'ALLOWED';
  }

  if (moduleStatus === FinancialPeriodStatus.HARD_LOCKED) {
    tracePeriodLockRejection({
      operationType,
      module,
      periodState: 'HARD_LOCKED',
      rejectionCode: 'LOCKED',
      period: periodStr,
    });
    throw new PeriodLockViolation(`الوحدة ${module} في الفترة ${periodStr} مغلقة نهائياً (CLOSED).`, 'LOCKED');
  }

  if (moduleStatus === FinancialPeriodStatus.SOFT_LOCKED) {
    let isModuleOverridden = false;

    if (overrideContext) {
      const { actorRole, reason, confirmationCode, tenantId: ctxTenant, actorId } = overrideContext;
      const isRoleValid = actorRole === 'MASTER_ADMIN' || actorRole === 'SUPER_ADMIN';
      const isReasonValid = reason && reason.trim().length >= 20;
      const isCodeValid = confirmationCode === 'CONFIRM-SOFT-LOCK-OVERRIDE';
      const isTenantMatch = ctxTenant === tenantId;
      const isActorMatch = actorId && actorId.trim().length > 0;

      if (isRoleValid && isReasonValid && isCodeValid && isTenantMatch && isActorMatch) {
        isModuleOverridden = true;
        
        // Write AuditLog for the successful module override (if not already written by global lock)
        if (!globalOverrideLogCreated) {
          try {
            await prisma.auditLog.create({
              data: {
                tenantId,
                action: 'SOFT_LOCK_OVERRIDE',
                entityType: 'FinancialPeriodModuleLock',
                entityId: modulePeriodLock?.id ? String(modulePeriodLock.id) : `${periodStr}:${module}`,
                userId: !isNaN(Number(actorId)) ? Number(actorId) : undefined,
                metadata: {
                  module,
                  operationType,
                  postingDate: postingDate.toISOString(),
                  reason,
                  requestId: overrideContext.requestId,
                  decision: 'ALLOWED_WITH_OVERRIDE',
                  scope: 'MODULE'
                }
              }
            });
          } catch (err) {
            log.error('Failed to write module override audit log', { errorMessage: err instanceof Error ? err.message : String(err) });
          }
        }

        traceOverrideUsed({
          operationType,
          module,
          periodState: 'SOFT_LOCKED',
          actorId,
          actorRole,
          reason: reason.slice(0, 200),
          traceId: overrideContext.requestId,
        });

        log.warn(`SOFT_LOCK bypassed via Master Override (Module: ${module})`, { tenantId, periodStr, operationType });
        return 'ALLOWED_WITH_OVERRIDE';
      }
    }

    // Invalid or missing override context for the module
    const violationMsg = `Financial period ${periodStr} is SOFT_LOCKED for module '${module}'. Operation '${operationType}' is rejected.`;
    log.warn(violationMsg, { tenantId, periodStr, status: 'SOFT_LOCKED', operationType, module });

    tracePeriodLockRejection({
      operationType,
      module,
      periodState: 'SOFT_LOCKED',
      rejectionCode: 'MASTER_OVERRIDE_REQUIRED',
      period: periodStr,
    });

    try {
      await prisma.periodLockLog.create({
        data: {
          tenantId,
          action: `REJECTED_${operationType}`,
          actionBy: actor,
          reason: violationMsg,
          fiscalPeriod: {
            connectOrCreate: {
              where: { year_month: { year, month: postingDate.getMonth() + 1 } },
              create: { tenantId, year, month: postingDate.getMonth() + 1 }
            }
          }
        }
      });
    } catch (err) {
      log.error('Failed to write module period lock audit log', { errorMessage: err instanceof Error ? err.message : String(err) });
    }

    throw new PeriodLockViolation(`الفترة المحاسبية ${periodStr} للوحدة ${module} مقفلة جزئياً (SOFT_LOCKED). يتطلب تجاوز إداري (Master Override).`, 'MASTER_OVERRIDE_REQUIRED');
  }

  // Fallback for any unknown status
  throw new PeriodLockViolation(`حالة الفترة غير معروفة.`, 'LOCKED');
}
