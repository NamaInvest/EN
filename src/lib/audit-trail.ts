import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export interface AuditEventPayload {
  tenantId: string;
  userId?: number | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'REVERSE' | 'ADJUST' | 'SYSTEM_RECONCILIATION';
  entityType: string;
  entityId: string | number;
  route?: string | null;
  oldData?: Record<string, any> | any[] | null;
  newData?: Record<string, any> | any[] | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
}

/**
 * Logs an audit event into the database safely within a transaction.
 * By default, this function will suppress errors to avoid breaking the main business logic transaction
 * unless `strict` is set to true.
 * 
 * @param txOrPrisma Prisma transaction client or main Prisma client
 * @param payload The audit event data
 * @param strict If true, throws an error if logging fails, potentially rolling back the transaction. Defaults to false.
 */
export async function logAuditEvent(
  txOrPrisma: Prisma.TransactionClient | PrismaClient,
  payload: AuditEventPayload,
  strict: boolean = false
): Promise<void> {
  try {
    // Cast entityId to string to match schema
    const entityIdStr = String(payload.entityId);

    await txOrPrisma.auditLog.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.userId || null,
        action: payload.action,
        entityType: payload.entityType,
        entityId: entityIdStr,
        route: payload.route || null,
        oldData: payload.oldData ? (payload.oldData as Prisma.InputJsonValue) : undefined,
        newData: payload.newData ? (payload.newData as Prisma.InputJsonValue) : undefined,
        metadata: payload.metadata ? (payload.metadata as Prisma.InputJsonValue) : undefined,
        ipAddress: payload.ipAddress || null,
      },
    });
  } catch (error) {
    logger.error({ error, payload }, 'Failed to write to AuditLog');
    if (strict) {
      throw new Error(`Audit log creation failed: ${(error as Error).message}`);
    }
  }
}
