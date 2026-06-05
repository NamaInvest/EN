/**
 * Prisma Audit Middleware — Multi-Tenant & Compliance Edition
 * ═════════════════════════════════════════════════════════════
 * 
 * القوانين المعمارية (Architectural Laws):
 * 1. Immutable Audit Log: No record is ever truly deleted without a trace.
 * 2. Multi-Tenant Isolation: Every audit log MUST belong to a specific tenant.
 * 3. User Accountability: Every create/update/delete operation is linked to a user.
 * 4. Field-Level Auditing: Record exact before/after state for critical tables (F-17).
 * 
 * Compliant with: Saudi PDPL (PII protection), SOCPA, SOX Section 404
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/observability/request-context';

const log = logger.child({ service: 'prisma-audit' });

// النماذج المستثناة من التدقيق بالكامل
const EXCLUDED_MODELS = new Set([
    'AuditLog',
    'Session',
    'UserBackupCode',
    'MfaAttempt',
    'PosSession'
]);

// الحقول الحساسة المطلوب حجب قيمها امتثالاً لنظام حماية البيانات الشخصية السعودي (PDPL)
const MASKED_FIELDS = new Set([
    'password', 'passwordHash', 'nationalId', 'iqama', 'passportNumber',
    'bankAccountNumber', 'iban', 'cvv', 'pin', 'secret'
]);

// الجداول الاستراتيجية التي نطبق عليها التدقيق التفصيلي (Field-Level Diffing) لضمان أعلى أداء للنظام
const CRITICAL_TABLES = new Set([
    'Employee', 'PayrollRecord', 'Vendor', 'Asset', 'JournalEntry',
    'JournalLine', 'SalesInvoice', 'PurchaseInvoice', 'Customer',
    'PurchaseOrder', 'SalesOrder', 'IfrsLeaseContract'
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

        const model = params.model;
        const isCritical = CRITICAL_TABLES.has(model);

        // 3. استخراج معلومات المستأجر (Tenant) من السياق الموحد أو البيئة
        const reqContext = getRequestContext();
        let tenantId = reqContext?.tenantId;
        if (!tenantId) {
            try {
                const prismaModule = require('./prisma');
                tenantId = prismaModule.tenantContext?.getStore() || prismaModule.currentRequestStore?.getStore();
            } catch {
                // ignore
            }
        }
        if (!tenantId) {
            tenantId = 'default';
        }

        // 4. استخراج معرف المستخدم (UserId) من السياق أو المعاملة
        let userId: number | null = null;
        if (reqContext?.actorId) {
            userId = parseInt(reqContext.actorId) || null;
        }
        if (!userId) {
            if (params.args?.data?.userId) userId = params.args.data.userId;
            else if (params.args?.data?.createdById) userId = params.args.data.createdById;
            else if (params.args?.data?.updatedById) userId = params.args.data.updatedById;
        }

        // 5. جلب الحالة السابقة (Before State) للجداول الحرجة قبل التعديل أو الحذف
        let before: any = null;
        if (isCritical && ['update', 'delete'].includes(params.action) && params.args?.where) {
            try {
                before = await prisma[model].findFirst({
                    where: params.args.where
                });
            } catch (err: any) {
                log.warn('Failed to fetch before-state for auditing', { model, error: err.message });
            }
        }

        // 6. تنفيذ العملية الأصلية وتسجيل الوقت المستغرق
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

            // 7. بناء وتخزين سجل التدقيق التفصيلي (Audit Trail Log)
            if (!operationError && (result || params.action.includes('delete'))) {
                try {
                    const actionType = getAuditAction(params.action);
                    let recordId = result?.id?.toString() || before?.id?.toString() || 'unknown';

                    let oldDataJson: any = null;
                    let newDataJson: any = null;
                    let diffJson: any = null;

                    // في حالة العمليات التفصيلية للجداول الاستراتيجية
                    if (isCritical) {
                        if (actionType === 'UPDATE' && before) {
                            // جلب الحالة النهائية الفعلية بعد تنفيذ التحديث لضمان دقة البيانات المحفوظة
                            const after = await prisma[model].findFirst({
                                where: { id: before.id }
                            }).catch(() => null);

                            if (after) {
                                oldDataJson = before;
                                newDataJson = after;

                                const diffObj: Record<string, { before: any; after: any }> = {};
                                const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

                                for (const key of allKeys) {
                                    if (['updatedAt', 'createdAt', 'deletedAt'].includes(key)) continue;
                                    const oldVal = before[key];
                                    const newVal = after[key];

                                    if (JSON.stringify(oldVal ?? null) !== JSON.stringify(newVal ?? null)) {
                                        const masked = MASKED_FIELDS.has(key);
                                        diffObj[key] = {
                                            before: masked ? '***' : oldVal,
                                            after: masked ? '***' : newVal
                                        };
                                    }
                                }
                                diffJson = diffObj;
                            }
                        } else if (actionType === 'DELETE' && before) {
                            oldDataJson = before;
                            newDataJson = null;
                            diffJson = { _deleted: { before, after: null } };
                        } else if (actionType === 'CREATE' && result) {
                            oldDataJson = null;
                            newDataJson = result;
                            diffJson = result;
                        }
                    } else {
                        // الجداول العادية غير الحرجة نكتفي بحفظ مدخلاتها الأساسية حفاظاً على كفاءة قاعدة البيانات
                        const rawDiff = params.args?.data ? JSON.stringify(params.args.data) : null;
                        diffJson = rawDiff ? JSON.parse(rawDiff) : Prisma.JsonNull;
                    }

                    // كتابة سجل التدقيق بطريقة آمنة (دون حجب تدفق المعاملة الأساسية في حال وجود عائق طارئ)
                    await prisma.auditLog.create({
                        data: {
                            tenantId,
                            userId,
                            action: actionType,
                            tableName: model,
                            recordId,
                            entityType: model,
                            entityId: recordId,
                            oldData: oldDataJson ? oldDataJson : Prisma.JsonNull,
                            newData: newDataJson ? newDataJson : Prisma.JsonNull,
                            diff: diffJson ? diffJson : Prisma.JsonNull,
                            route: reqContext?.module ?? null,
                            details: `Execution: ${executionTime}ms. Operation: ${params.action}`,
                        }
                    });

                } catch (auditError: any) {
                    log.error('Critical Failure: Compliance Audit Log Write Failed', {
                        tenantId,
                        model,
                        action: params.action,
                        error: auditError.message
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
