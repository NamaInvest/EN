/**
 * Period & Year-End Close — Unified Facade
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolves the 3-engine duplication identified in the architectural graph:
 *   lib/period-close.ts         → PeriodCloseEngine (month-end, low-level)
 *   lib/period-close-engine.ts  → adapter + SOCPA 14-step checklist
 *   lib/year-end-engine.ts      → YearEndCloseEngine (annual, 28 tasks)
 *
 * This file is the single canonical import path for all close operations.
 * External code should import from HERE, not from the individual files.
 *
 * Usage:
 *   import { closeApi } from '@/lib/close';
 *   await closeApi(prisma).period.initTasks(periodId);
 *   await closeApi(prisma).yearEnd.initiateRun(fiscalYearId, userId);
 */
import { PrismaClient } from '@prisma/client';

// Re-export canonical SOCPA steps constant so consumers don't import from the lower files
export {
  SOCPA_CLOSE_STEPS,
  type StepCode,
  initPeriodCloseTasks,
  completeTask,
  getPeriodCloseStatus,
  executeSoftClose,
  executeHardClose,
} from '../period-close-engine';

export { YearEndCloseEngine } from '../year-end-engine';
export { PeriodCloseEngine  } from '../period-close';

// ─── Unified API ─────────────────────────────────────────────────────────────

import {
  initPeriodCloseTasks,
  completeTask,
  getPeriodCloseStatus,
  executeSoftClose,
  executeHardClose,
} from '../period-close-engine';
import { YearEndCloseEngine } from '../year-end-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.close.index.' });

export function closeApi(prisma: PrismaClient) {
  return {
    /** Month-end / period close operations */
    period: {
      initTasks:   (periodId: number) => initPeriodCloseTasks(prisma, periodId),
      completeTask: (periodId: number, taskCode: string, userId: string, notes?: string) =>
        completeTask(prisma, periodId, taskCode, userId, notes),
      getStatus:   (periodId: number) => getPeriodCloseStatus(prisma, periodId),
      softClose:   (periodId: number, userId: string) => executeSoftClose(prisma, periodId, userId),
      hardClose:   (periodId: number, userId: string) => executeHardClose(prisma, periodId, userId),
    },

    /** Annual year-end close operations */
    yearEnd: {
      initiateRun: (fiscalYearId: number, userId: string) =>
        YearEndCloseEngine.initiateRun(fiscalYearId, userId),
    },
  };
}

export type CloseApi = ReturnType<typeof closeApi>;
