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

  const period = await prisma.financialPeriod.findUnique({
    where: {
      tenantId_period: {
        tenantId,
        period: periodStr,
      },
    },
  });

  // If period record does not exist, default behavior is that it is implicitly OPEN in this system
  const status = period?.status || FinancialPeriodStatus.OPEN;

  if (status === FinancialPeriodStatus.OPEN) {
    return 'ALLOWED';
  }

  // HARD_LOCKED is absolute. No override allowed.
  if (status === FinancialPeriodStatus.HARD_LOCKED) {
    // Phase 10: Structured rejection trace for HARD_LOCK
    tracePeriodLockRejection({
      operationType,
      module,
      periodState: 'HARD_LOCKED',
      rejectionCode: 'LOCKED',
      period: periodStr,
    });
    throw new PeriodLockViolation(`الفترة المحاسبية ${periodStr} مغلقة نهائياً (CLOSED).`, 'LOCKED');
  }

  // If SOFT_LOCKED, check for a valid override context
  if (status === FinancialPeriodStatus.SOFT_LOCKED) {
    if (overrideContext) {
      // Validate override context
      const { actorRole, reason, confirmationCode, tenantId: ctxTenant, actorId } = overrideContext;
      
      const isRoleValid = actorRole === 'MASTER_ADMIN' || actorRole === 'SUPER_ADMIN';
      const isReasonValid = reason && reason.trim().length >= 20;
      const isCodeValid = confirmationCode === 'CONFIRM-SOFT-LOCK-OVERRIDE';
      const isTenantMatch = ctxTenant === tenantId;
      const isActorMatch = actorId && actorId.trim().length > 0;

      if (isRoleValid && isReasonValid && isCodeValid && isTenantMatch && isActorMatch) {
        // Write AuditLog for the successful override
        try {
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: 'SOFT_LOCK_OVERRIDE',
              entityType: 'FinancialPeriod',
              entityId: period?.id ? String(period.id) : periodStr,
              userId: !isNaN(Number(actorId)) ? Number(actorId) : undefined,
              metadata: {
                module,
                operationType,
                postingDate: postingDate.toISOString(),
                reason,
                requestId: overrideContext.requestId,
                decision: 'ALLOWED_WITH_OVERRIDE'
              }
            }
          });
        } catch (err) {
          log.error('Failed to write override audit log', { errorMessage: err instanceof Error ? err.message : String(err) });
        }

        // Phase 10: Structured override trace (non-blocking)
        traceOverrideUsed({
          operationType,
          module,
          periodState: 'SOFT_LOCKED',
          actorId,
          actorRole,
          reason: reason.slice(0, 200), // truncate: never log full user input
          traceId: overrideContext.requestId,
        });

        log.warn(`SOFT_LOCK bypassed via Master Override`, { tenantId, periodStr, operationType });
        return 'ALLOWED_WITH_OVERRIDE';
      }
    }

    // Invalid or missing override context
    const violationMsg = `Financial period ${periodStr} is SOFT_LOCKED. Operation '${operationType}' from module '${module}' is rejected.`;
    log.warn(violationMsg, { tenantId, periodStr, status: 'SOFT_LOCKED', operationType, module });

    // Phase 10: Structured rejection trace
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

    throw new PeriodLockViolation(`الفترة المحاسبية ${periodStr} مقفلة جزئياً (SOFT_LOCKED). يتطلب تجاوز إداري (Master Override).`, 'MASTER_OVERRIDE_REQUIRED');
  }

  // Fallback for any unknown status
  throw new PeriodLockViolation(`حالة الفترة غير معروفة.`, 'LOCKED');
}
