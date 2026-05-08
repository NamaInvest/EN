import prisma from '@/lib/prisma';

export async function logAuditAction(params: {
    userId: number;
    action: string;
    tableName: string;
    recordId?: number;
    details?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                tableName: params.tableName,
                recordId: params.recordId,
                details: params.details,
            }
        });
    } catch (e: any) {
        console.error("Audit log failed to save:", e);
    }
}
