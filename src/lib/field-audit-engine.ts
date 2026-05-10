/**
 * Field-Level Audit Trail Engine
 * 
 * يسجّل كل تعديل على أي حقل في أي جدول — من غيّر ماذا ومتى.
 * يدعم الامتثال لـ PDPL/SOX.
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'field-audit-engine' });

// Helper: Prisma generated types may lag in IDE — cast for new models
const db = (p: PrismaClient) => p as any;

export interface FieldChange {
    fieldName: string;
    oldValue: any;
    newValue: any;
}

export async function logFieldChanges(
    prisma: PrismaClient,
    tableName: string,
    recordId: number,
    changes: FieldChange[],
    changedBy: number,
    ipAddress?: string,
    userAgent?: string
): Promise<number> {
    if (changes.length === 0) return 0;

    const diffObject: Record<string, any> = {};
    for (const c of changes) {
        diffObject[c.fieldName] = { before: c.oldValue, after: c.newValue };
    }

    const result = await db(prisma).auditLog.create({
        data: {
            tableName,
            recordId,
            userId: changedBy,
            action: 'UPDATE',
            diff: diffObject,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
        }
    });

    return Object.keys(diffObject).length;
}

/**
 * detectChanges — يقارن بين الكائن القديم والجديد ويستخرج الفروق
 */
export function detectChanges(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
    trackedFields?: string[]
): FieldChange[] {
    const changes: FieldChange[] = [];
    const fields = trackedFields || Object.keys(newObj);

    for (const field of fields) {
        if (field === 'id' || field === 'createdAt' || field === 'updatedAt') continue;
        const oldVal = oldObj[field];
        const newVal = newObj[field];
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
            changes.push({ fieldName: field, oldValue: oldVal, newValue: newVal });
        }
    }
    return changes;
}

export async function getAuditHistory(
    prisma: PrismaClient,
    tableName: string,
    recordId: number
): Promise<any[]> {
    return db(prisma).auditLog.findMany({
        where: { tableName, recordId },
        orderBy: { date: 'desc' },
        take: 100,
    });
}
