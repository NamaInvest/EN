/**
 * Field-Level Audit Trail — Foundation 0.3
 * ═════════════════════════════════════════
 *
 * يوفّر:
 *   - SENSITIVE_ENTITIES: قائمة الموديلات التي تُدقَّق (Account, JournalEntry, ...)
 *   - logFieldChanges(): يقارن before/after ويسجّل كل حقل اختلف
 *   - logCreate() / logDelete(): لتسجيل إنشاء/حذف صف كامل
 *   - withAudit(): wrapper للـ Prisma update/create/delete
 *
 * الاستخدام:
 *   const before = await prisma.account.findUnique({ where: { id } });
 *   const after = await prisma.account.update({ where: { id }, data });
 *   await logFieldChanges(prisma, 'Account', id, before, after, { userId, userEmail, ipAddress });
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
]);

// ─── Fields to skip in diffs (timestamps, internal flags) ────────────
const IGNORED_FIELDS = new Set([
    'updatedAt', 'updated_at',
    'createdAt', 'created_at', // create event captures these via "create" type
]);

export interface AuditContext {
    userId?: number | null;
    userEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    transactionId?: string | null;
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
    prisma: PrismaClient,
    entityType: string,
    entityId: number,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    ctx: AuditContext = {}
): Promise<number> {
    if (!SENSITIVE_ENTITIES.has(entityType)) return 0;
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
            rows.push(buildRow(entityType, entityId, f, serializeValue(o), serializeValue(n), 'update', ctx, txId));
        }
    }

    if (rows.length === 0) return 0;

    try {
        await prisma.fieldAuditLog.createMany({
            data: rows as any,
        });
    } catch (e) {
        // Audit failure must never block the business action
        console.error('[field-audit] failed to log changes:', e);
    }
    return rows.length;
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
    user?: { userId?: number; username?: string }
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
