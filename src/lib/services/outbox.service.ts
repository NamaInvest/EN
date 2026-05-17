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
}
