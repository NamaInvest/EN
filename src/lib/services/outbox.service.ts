import { Prisma, PrismaClient } from '@prisma/client';

export type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateOutboxEventInput {
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
  idempotencyKey?: string;
}

type OutboxDiagnosticsClient = Pick<PrismaClient, 'outboxEvent'>;

export interface OutboxDiagnostics {
  pendingCount: number;
  processingCount: number;
  processedCount: number;
  failedCount: number;
  oldestPendingEvent: { id: number; createdAt: Date; eventType: string } | null;
  exceededRetryLimitCount: number;
}

const OUTBOX_MAX_ATTEMPTS = 5;

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
  static async getDiagnostics(prismaClient: OutboxDiagnosticsClient, tenantId: string): Promise<OutboxDiagnostics> {
    if (!tenantId || tenantId.trim() === '') {
      throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenantId for outbox diagnostics.');
    }

    const tenantWhere = { tenantId };

    const [pendingCount, processingCount, processedCount, failedCount, oldestPending, exceededRetry] = await Promise.all([
      prismaClient.outboxEvent.count({ where: { ...tenantWhere, status: 'PENDING' } }),
      prismaClient.outboxEvent.count({ where: { ...tenantWhere, status: 'PROCESSING' } }),
      prismaClient.outboxEvent.count({ where: { ...tenantWhere, status: 'PROCESSED' } }),
      prismaClient.outboxEvent.count({ where: { ...tenantWhere, status: 'FAILED' } }),
      prismaClient.outboxEvent.findFirst({
        where: { ...tenantWhere, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, createdAt: true, eventType: true }
      }),
      prismaClient.outboxEvent.count({
        where: { ...tenantWhere, status: 'FAILED', attempts: { gte: OUTBOX_MAX_ATTEMPTS } }
      })
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
