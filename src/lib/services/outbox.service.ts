import { Prisma } from '@prisma/client';

export type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateOutboxEventInput {
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: any;
  idempotencyKey?: string;
}

export class OutboxService {
  /**
   * Creates an OutboxEvent within the provided transaction context.
   * This guarantees atomic persistence along with domain mutations.
   * 
   * @param tx The Prisma Transaction Client
   * @param input Outbox Event Data
   */
  static async emit(tx: TxClient, input: CreateOutboxEventInput) {
    if (!input.tenantId || input.tenantId.trim() === '' || input.tenantId.toLowerCase() === 'default' || input.tenantId === '1') {
      throw new Error('[OutboxService] Invalid tenantId: Must be an explicit, valid tenant ID.');
    }

    if (!input.aggregateId || !input.aggregateType || !input.eventType || !input.payload) {
      throw new Error('[OutboxService] Missing required outbox event fields (aggregateId, aggregateType, eventType, payload).');
    }

    return await tx.outboxEvent.create({
      data: {
        tenantId: input.tenantId,
        aggregateId: input.aggregateId,
        aggregateType: input.aggregateType,
        eventType: input.eventType,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey || null,
        status: 'PENDING',
        attempts: 0
      }
    });
  }

  /**
   * Retrieves read-only observability statistics for the Outbox system.
   * Does NOT modify any event state.
   */
  static async getDiagnostics(prismaClient: any): Promise<{
    pendingCount: number;
    processingCount: number;
    processedCount: number;
    failedCount: number;
    oldestPendingEvent: { id: number | string; createdAt: Date; eventType: string } | null;
    exceededRetryLimitCount: number;
  }> {
    const [pendingCount, processingCount, processedCount, failedCount, oldestPending, exceededRetry] = await Promise.all([
      prismaClient.outboxEvent.count({ where: { status: 'PENDING' } }),
      prismaClient.outboxEvent.count({ where: { status: 'PROCESSING' } }),
      prismaClient.outboxEvent.count({ where: { status: 'PROCESSED' } }),
      prismaClient.outboxEvent.count({ where: { status: 'FAILED' } }),
      prismaClient.outboxEvent.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, createdAt: true, eventType: true }
      }),
      prismaClient.outboxEvent.count({ where: { status: 'FAILED', attempts: { gte: 5 } } }) // MAX_ATTEMPTS is 5 in the worker
    ]);

    return {
      pendingCount,
      processingCount,
      processedCount,
      failedCount,
      oldestPendingEvent: oldestPending,
      exceededRetryLimitCount: exceededRetry
    };
  }
}
