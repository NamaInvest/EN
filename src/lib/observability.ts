import { PrismaClient } from '@prisma/client';

export function applyObservability(prisma: PrismaClient) {
    // 1. Slow Query Logger
    prisma.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        const duration = after - before;

        if (duration > 500) { // Log queries slower than 500ms
            console.warn(`[SLOW QUERY] ${params.model}.${params.action} took ${duration}ms`);
            
            // In a production environment, send this to Sentry or DataDog
            // Sentry.captureMessage(`Slow query: ${params.model}.${params.action} (${duration}ms)`);
        }

        return result;
    });

    // 2. Audit Trail for Sensitive Actions (Mock implementation)
    prisma.$use(async (params, next) => {
        const sensitiveModels = ['JournalEntry', 'Vendor', 'Employee', 'Payroll'];
        const sensitiveActions = ['create', 'update', 'delete', 'updateMany', 'deleteMany'];

        if (sensitiveModels.includes(params.model as string) && sensitiveActions.includes(params.action)) {
            // Log to Audit table
            // console.log(`[AUDIT] Action: ${params.action} on ${params.model}`);
            // e.g. prisma.auditLog.create(...)
        }

        return await next(params);
    });
}
