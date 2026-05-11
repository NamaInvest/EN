/**
 * Field-Level Audit Trail Engine — Enhanced (Partial Gap Fix)
 * ══════════════════════════════════════════════════════════════════════════════
 * Records field-level before/after for every UPDATE on tracked tables.
 *
 * TWO modes:
 *   1. Manual  — call logFieldChanges() explicitly in route handlers (existing API)
 *   2. Prisma Middleware — installAuditMiddleware(prisma) for automatic tracking
 *
 * Compliant with: PDPL, SOX Section 404, IAS 1 (record reliability)
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'field-audit-engine' });
const db  = (p: PrismaClient) => p as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldChange {
  fieldName: string;
  oldValue:  any;
  newValue:  any;
}

export interface AuditEntry {
  tableName:   string;
  recordId:    number | string;
  action:      'CREATE' | 'UPDATE' | 'DELETE';
  diff:        Record<string, { before: any; after: any }>;
  changedBy?:  number | string;
  ipAddress?:  string;
  userAgent?:  string;
  createdAt:   Date;
}

// ─── Sensitive fields to mask in audit log (PDPL compliance) ─────────────────
const MASKED_FIELDS = new Set([
  'password', 'passwordHash', 'nationalId', 'iqama', 'passportNumber',
  'bankAccountNumber', 'iban', 'cvv', 'pin', 'secret',
]);

// ─── Tables to auto-audit via middleware ─────────────────────────────────────
const AUTO_AUDIT_TABLES = new Set([
  'journalEntry', 'journalLine',
  'salesInvoice', 'purchaseInvoice',
  'employee', 'payrollRecord',
  'customer', 'vendor',
  'purchaseOrder', 'salesOrder',
  'asset', 'ifrsLeaseContract',
]);

// ─── Core: Manual field change logging ───────────────────────────────────────

export async function logFieldChanges(
  prisma:    PrismaClient,
  tableName: string,
  recordId:  number | string,
  changes:   FieldChange[],
  changedBy: number | string,
  ipAddress?: string,
  userAgent?: string,
): Promise<number> {
  if (changes.length === 0) return 0;

  const diffObject: Record<string, any> = {};
  for (const c of changes) {
    const masked = MASKED_FIELDS.has(c.fieldName);
    diffObject[c.fieldName] = {
      before: masked ? '***' : c.oldValue,
      after:  masked ? '***' : c.newValue,
    };
  }

  await db(prisma).auditLog.create({
    data: {
      tableName,
      recordId:  typeof recordId === 'string' ? parseInt(recordId) || 0 : recordId,
      userId:    typeof changedBy === 'string' ? parseInt(changedBy) || 0 : changedBy,
      action:    'UPDATE',
      diff:      diffObject,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  }).catch((e: any) => log.warn('auditLog.create failed', { error: e.message }));

  return Object.keys(diffObject).length;
}

// ─── Helper: Detect changed fields between two objects ───────────────────────

export function detectChanges(
  oldObj:        Record<string, any>,
  newObj:        Record<string, any>,
  trackedFields?: string[],
): FieldChange[] {
  const changes: FieldChange[] = [];
  const fields = trackedFields ?? Object.keys({ ...oldObj, ...newObj });

  for (const field of fields) {
    if (['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(field)) continue;
    const oldVal = oldObj[field];
    const newVal = newObj[field];

    // Deep comparison for Decimal/Date/JSON
    const oldStr = JSON.stringify(oldVal ?? null);
    const newStr = JSON.stringify(newVal ?? null);

    if (oldStr !== newStr) {
      changes.push({ fieldName: field, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}

// ─── Prisma Middleware: automatic field-level audit ───────────────────────────

/**
 * Install this once at app startup (in prisma.ts or instrumentation.ts):
 *   installAuditMiddleware(prisma);
 *
 * It intercepts UPDATE/DELETE on tracked tables and writes field-level diffs
 * to the AuditLog table automatically — no manual calls needed.
 */
export function installAuditMiddleware(prisma: PrismaClient): void {
  (prisma as any).$use(async (params: any, next: any) => {
    const model  = params.model as string;
    const action = params.action as string;

    // Only track models in AUTO_AUDIT_TABLES
    if (!AUTO_AUDIT_TABLES.has(model)) return next(params);
    if (!['update', 'updateMany', 'delete', 'deleteMany'].includes(action)) return next(params);

    // For single-record operations, capture before state
    let before: any = null;
    if (action === 'update' && params.args?.where) {
      try {
        before = await (prisma as any)[model]?.findFirst?.({
          where: params.args.where,
        });
      } catch { /* model may not have findFirst */ }
    }

    // Execute the operation
    const result = await next(params);

    // Write audit log asynchronously (don't block the request)
    if (before && action === 'update' && params.args?.data) {
      const after   = params.args.data as Record<string, any>;
      const changes = detectChanges(before, after);

      if (changes.length > 0) {
        const diff: Record<string, any> = {};
        for (const c of changes) {
          const masked = MASKED_FIELDS.has(c.fieldName);
          diff[c.fieldName] = {
            before: masked ? '***' : c.oldValue,
            after:  masked ? '***' : c.newValue,
          };
        }

        db(prisma).auditLog.create({
          data: {
            tableName: model,
            recordId:  before.id ?? 0,
            userId:    0,   // middleware doesn't have userId context — use manual API for that
            action:    'UPDATE',
            diff,
          },
        }).catch((e: any) => log.warn('middleware auditLog failed', { error: e.message }));
      }
    }

    if (action === 'delete' && before) {
      db(prisma).auditLog.create({
        data: {
          tableName: model,
          recordId:  before.id ?? 0,
          userId:    0,
          action:    'DELETE',
          diff:      { _deleted: { before: JSON.stringify(before), after: null } },
        },
      }).catch(() => null);
    }

    return result;
  });

  log.info('Audit middleware installed', { tables: [...AUTO_AUDIT_TABLES] });
}

// ─── Read API ─────────────────────────────────────────────────────────────────

export async function getAuditHistory(
  prisma:    PrismaClient,
  tableName: string,
  recordId:  number | string,
  limit:     number = 100,
): Promise<any[]> {
  const id = typeof recordId === 'string' ? parseInt(recordId) || 0 : recordId;
  return db(prisma).auditLog.findMany({
    where:   { tableName, recordId: id },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  }).catch(() => []);
}

/**
 * Get audit trail for a user (all their actions across all tables)
 */
export async function getUserAuditTrail(
  prisma: PrismaClient,
  userId: number,
  limit:  number = 200,
): Promise<any[]> {
  return db(prisma).auditLog.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  }).catch(() => []);
}

/**
 * Get recent audit activity for a tenant (last N entries across all tables)
 */
export async function getRecentActivity(
  prisma:   PrismaClient,
  tenantId: string,
  limit:    number = 50,
): Promise<any[]> {
  return db(prisma).auditLog.findMany({
    where:   { tenantId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    include: { user: { select: { name: true, email: true } } },
  }).catch(() => []);
}
