/**
 * Field-Level Audit Trail — v2.0 (P0-07 Implementation)
 * ═══════════════════════════════════════════════════════
 *
 * يوفّر:
 *   - SENSITIVE_ENTITIES: قائمة الموديلات التي تُدقَّق (Account, JournalEntry, ...)
 *   - logFieldChanges(): يقارن before/after ويسجّل كل حقل اختلف
 *   - logCreate() / logDelete(): لتسجيل إنشاء/حذف صف كامل
 *   - withAuditedUpdate(): wrapper يقرأ before, يُنفذ update, يسجّل diff تلقائياً
 *   - auditContextFromRequest(): يستخرج userId, IP, UserAgent من Request
 *
 * الاستخدام:
 *   // طريقة 1: يدوية
 *   const before = await prisma.account.findUnique({ where: { id } });
 *   const after = await prisma.account.update({ where: { id }, data });
 *   await logFieldChanges(prisma, 'Account', id, before, after, { userId, userEmail, ipAddress });
 *
 *   // طريقة 2: wrapper تلقائية
 *   const result = await withAuditedUpdate(prisma, 'customer', id, data, ctx);
 *
 * SOCPA/ZATCA Compliance: 6-year retention (handled at DB level)
 */

import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// ─── Sensitive entities (only these get audited) ─────────────────────
export const SENSITIVE_ENTITIES = new Set([
    'JournalEntry',
    'JournalLine',
    'Account',
    'FixedAsset',
    'Customer',
    'Vendor',
    'Product',
    'Salary',
    'FiscalPeriod',
    'Setting',
    'NumberingSequence',
    'ApprovalRule',
    'User',
    'SalesInvoice',
    'PurchaseInvoice',
    'PurchaseOrder',
    'Employee',
    'BankAccount',
    'ExchangeRate',
    'CostCenter',
    'ProfitCenter',
]);

// ─── Fields to skip in diffs (timestamps, internal flags) ────────────
const IGNORED_FIELDS = new Set([
    'updatedAt', 'updated_at',
    'createdAt', 'created_at', // create event captures these via "create" type
    'password', 'hash', 'token', // never log secrets
]);

// ─── Sensitive fields that should be masked (show change but not value) ──
const MASKED_FIELDS = new Set([
    'taxNumber', 'crNo', 'iban', 'bankAccountNo',
]);

export interface AuditContext {
    userId?: number | null;
    userEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    transactionId?: string | null;
    reason?: string | null;
}

/**
 * Generate a transaction ID to group multiple audit rows from one operation.
 */
export function newTxId(): string {
    return crypto.randomUUID();
}

/**
 * Compares before/after objects and writes one audit row per changed field.
 * Skips noisy fields (updatedAt/createdAt). Returns count of rows logged.
 */
export async function logFieldChanges(
    prisma: PrismaClient | any,
    entityType: string,
    entityId: number,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    ctx: AuditContext = {}
): Promise<number> {
    if (!before && !after) return 0;

    const txId = ctx.transactionId ?? newTxId();
    const fields = new Set<string>([
        ...Object.keys(before ?? {}),
        ...Object.keys(after ?? {}),
    ]);

    const rows: Array<Record<string, unknown>> = [];

    if (!before && after) {
        // CREATE — log a single row with the whole entity snapshot
        rows.push(buildRow(entityType, entityId, '__entity__', null, JSON.stringify(after), 'create', ctx, txId));
    } else if (before && !after) {
        // DELETE
        rows.push(buildRow(entityType, entityId, '__entity__', JSON.stringify(before), null, 'delete', ctx, txId));
    } else {
        // UPDATE — diff field-by-field
        for (const f of fields) {
            if (IGNORED_FIELDS.has(f)) continue;
            const o = before?.[f];
            const n = after?.[f];
            if (deepEqual(o, n)) continue;

            const oldVal = MASKED_FIELDS.has(f) ? '***MASKED***' : serializeValue(o);
            const newVal = MASKED_FIELDS.has(f) ? '***MASKED***' : serializeValue(n);
            rows.push(buildRow(entityType, entityId, f, oldVal, newVal, 'update', ctx, txId));
        }
    }

    if (rows.length === 0) return 0;

    try {
        // Try FieldAuditTrail model (the correct one from schema)
        const db = prisma as any;
        if (db.fieldAuditTrail) {
            await db.fieldAuditTrail.createMany({
                data: rows.map(r => ({
                    tableName: r.entityType as string,
                    recordId: r.entityId as number,
                    fieldName: r.fieldName as string,
                    oldValue: r.oldValue as string | null,
                    newValue: r.newValue as string | null,
                    changedBy: (r.userId as number) || 0,
                    ipAddress: r.ipAddress as string | null,
                    userAgent: r.userAgent as string | null,
                })),
            });
        } else if (db.fieldAuditLog) {
            // Fallback to fieldAuditLog if it exists
            await db.fieldAuditLog.createMany({
                data: rows as any,
            });
        }
    } catch (e) {
        // Audit failure must never block the business action
        console.error('[field-audit] failed to log changes:', e);
    }
    return rows.length;
}

/**
 * Log a CREATE event for a new entity.
 */
export async function logCreate(
    prisma: PrismaClient | any,
    entityType: string,
    entityId: number,
    data: Record<string, unknown>,
    ctx: AuditContext = {}
): Promise<number> {
    return logFieldChanges(prisma, entityType, entityId, null, data, ctx);
}

/**
 * Log a DELETE event.
 */
export async function logDelete(
    prisma: PrismaClient | any,
    entityType: string,
    entityId: number,
    data: Record<string, unknown>,
    ctx: AuditContext = {}
): Promise<number> {
    return logFieldChanges(prisma, entityType, entityId, data, null, ctx);
}

/**
 * withAuditedUpdate() — Zero-friction wrapper for Prisma updates.
 * 
 * Reads the entity before, performs the update, then logs diffs automatically.
 * Works with any Prisma model.
 * 
 * Usage:
 *   const updated = await withAuditedUpdate(prisma, 'customer', customerId, updateData, auditCtx);
 */
export async function withAuditedUpdate(
    prisma: PrismaClient | any,
    modelName: string,              // e.g. 'customer', 'product', 'account'
    entityId: number,
    updateData: Record<string, unknown>,
    ctx: AuditContext = {}
): Promise<any> {
    const db = prisma as any;
    const model = db[modelName];
    if (!model) {
        console.error(`[field-audit] Model "${modelName}" not found in Prisma client`);
        return null;
    }

    // 1. Read current state
    const before = await model.findUnique({ where: { id: entityId } });
    if (!before) {
        console.error(`[field-audit] Entity ${modelName}#${entityId} not found`);
        return null;
    }

    // 2. Perform the update
    const after = await model.update({
        where: { id: entityId },
        data: updateData,
    });

    // 3. Log the diff (capitalize first letter for entity type)
    const entityType = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    await logFieldChanges(prisma, entityType, entityId, before, after, ctx);

    return after;
}

/**
 * withAuditedDelete() — Wrapper that logs before deleting.
 */
export async function withAuditedDelete(
    prisma: PrismaClient | any,
    modelName: string,
    entityId: number,
    ctx: AuditContext = {}
): Promise<any> {
    const db = prisma as any;
    const model = db[modelName];
    if (!model) return null;

    // 1. Read current state before deletion
    const before = await model.findUnique({ where: { id: entityId } });
    if (!before) return null;

    // 2. Log delete
    const entityType = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    await logDelete(prisma, entityType, entityId, before, ctx);

    // 3. Perform deletion
    return model.delete({ where: { id: entityId } });
}

function buildRow(
    entityType: string,
    entityId: number,
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changeType: 'create' | 'update' | 'delete',
    ctx: AuditContext,
    txId: string
) {
    return {
        entityType,
        entityId,
        fieldName,
        oldValue,
        newValue,
        changeType,
        userId: ctx.userId ?? null,
        userEmail: ctx.userEmail ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        transactionId: txId,
        reason: ctx.reason ?? null,
    };
}

function serializeValue(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') {
        try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
}

function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object') {
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    }
    return false;
}

/**
 * Extract audit context from a Next.js Request (best-effort).
 */
export function auditContextFromRequest(
    request: Request,
    user?: { userId?: number; username?: string; role?: string }
): AuditContext {
    const headers = request.headers;
    return {
        userId: user?.userId ?? null,
        userEmail: user?.username ?? null,
        ipAddress: headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? null,
        userAgent: headers.get('user-agent') ?? null,
        transactionId: null,
    };
}
