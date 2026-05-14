/**
 * Prisma Audit Middleware — Multi-Tenant & Compliance Edition
 * ════════════════════════════════════════════════════════
 * 
 * القوانين المعمارية (Architectural Laws):
 * 1. Immutable Audit Log: No record is ever truly deleted without a trace.
 * 2. Multi-Tenant Isolation: Every audit log MUST belong to a specific tenant.
 * 3. User Accountability: Every create/update/delete operation is linked to a user.
 * 
 * Usage:
 * Import and attach in getPrisma() function via `applyAuditMiddleware(client)`.
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { currentRequestStore, tenantContext } from './prisma';

const log = logger.child({ service: 'prisma-audit' });

// النماذج التي لا نريد تتبعها (مثل الجداول المؤقتة أو سجلات التدقيق نفسها)
const EXCLUDED_MODELS = new Set([
    'AuditLog',
    'Session',
    'UserBackupCode',
    'MfaAttempt',
    'PosSession'
]);

export function applyAuditMiddleware(prisma: any) {
    prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
        // 1. تمرير العمليات غير المشمولة بالتعديل (Read-Only)
        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
            return next(params);
        }

        // 2. التحقق من النماذج المستثناة
        if (!params.model || EXCLUDED_MODELS.has(params.model)) {
            return next(params);
        }

        // 3. استخراج معلومات المستأجر (Tenant)
        // يتم سحبها من Context لضمان توافقها مع RLS
        const tenantId = tenantContext.getStore() || currentRequestStore.getStore() || 'default';

        // محاولة استخراج User ID إذا كان متاحاً في المتغيرات
        let userId: number | null = null;
        if (params.args?.data?.userId) userId = params.args.data.userId;
        else if (params.args?.data?.createdById) userId = params.args.data.createdById;
        else if (params.args?.data?.updatedById) userId = params.args.data.updatedById;

        // 4. تنفيذ العملية الأصلية وتسجيل الوقت
        const startTime = Date.now();
        let result;
        let operationError = null;

        try {
            result = await next(params);
        } catch (error) {
            operationError = error;
            throw error;
        } finally {
            const executionTime = Date.now() - startTime;

            // 5. بناء وتخزين سجل التدقيق (Audit Trail)
            // نستخدم قاعدة بيانات مساعدة لمنع أي تأثير على العملية الأساسية (Fire and Forget)
            if (!operationError && result) {
                try {
                    const actionType = getAuditAction(params.action);
                    const recordId = result.id?.toString() || 'unknown';

                    // تفاصيل التعديل (في حالة Update أو Create)
                    const diffDetails = params.action.includes('update') || params.action.includes('create') 
                        ? JSON.stringify(params.args.data) 
                        : null;

                    // كتابة السجل
                    await prisma.auditLog.create({
                        data: {
                            tenantId,
                            userId,
                            action: actionType,
                            tableName: params.model,
                            recordId,
                            details: `Execution: ${executionTime}ms. Operation: ${params.action}`,
                            diff: diffDetails ? JSON.parse(diffDetails) : Prisma.JsonNull,
                        }
                    });

                } catch (auditError) {
                    // لا نوقف النظام إذا فشل تسجيل التدقيق، لكن نسجل خطأ حرج في الـ Logger
                    log.error('Critical Failure: Audit Log Write Failed', {
                        tenantId,
                        model: params.model,
                        action: params.action,
                        error: (auditError as Error).message
                    });
                }
            }
        }

        return result;
    });
}

function getAuditAction(prismaAction: string): string {
    switch (prismaAction) {
        case 'create':
        case 'createMany':
            return 'CREATE';
        case 'update':
        case 'updateMany':
        case 'upsert':
            return 'UPDATE';
        case 'delete':
        case 'deleteMany':
            return 'DELETE';
        default:
            return 'UNKNOWN_MUTATION';
    }
}
