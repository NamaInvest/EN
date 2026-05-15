import { PrismaClient, IdempotencyStatus } from '@prisma/client';

export type WebhookSource = 'SALLA' | 'ZID' | 'TELEGRAM' | 'CRM' | 'PLATFORM';

export interface WebhookPayload {
  tenantId?: string;
  source: WebhookSource;
  idempotencyKey: string;
  data: any;
}

export class WebhookOrchestrator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async processWebhook<T>(
    payload: WebhookPayload,
    processor: (tx: any, data: any) => Promise<T>,
    requireFinancialTx = false,
    requireInventoryTx = false
  ): Promise<{ status: string; result?: T; error?: string }> {
    const { tenantId: incomingTenantId, source, idempotencyKey, data } = payload;
    const tenantId = incomingTenantId || 'SYSTEM_WEBHOOK';
    const endpoint = `/webhook/${source.toLowerCase()}`;

    if (!idempotencyKey) {
      throw new Error(`WEBHOOK_GOVERNANCE: idempotencyKey is required for ${source}.`);
    }

    const uniqueWhere = {
      tenantId_endpoint_key: {
        tenantId,
        endpoint,
        key: idempotencyKey
      }
    };

    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: uniqueWhere
    });

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return { status: 'DUPLICATE', result: existing.responseBody as T };
      }
      if (existing.status === 'IN_PROGRESS') {
        return { status: 'LOCKED', error: 'Webhook is currently being processed.' };
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.idempotencyRecord.upsert({
      where: uniqueWhere,
      update: { status: 'IN_PROGRESS' },
      create: {
        tenantId,
        endpoint,
        key: idempotencyKey,
        requestHash: 'N/A',
        status: 'IN_PROGRESS',
        expiresAt
      }
    });

    try {
      let result: T;
      
      if (!requireFinancialTx && !requireInventoryTx) {
          result = await this.prisma.$transaction(async (tx) => {
              return await processor(tx, data);
          });
      } else if (requireFinancialTx) {
          const { runFinancialTx } = require('@/lib/db/transaction');
          result = await runFinancialTx(this.prisma, async (tx: any) => {
             return await processor(tx, data);
          }, `WEBHOOK_${source}`);
      } else if (requireInventoryTx) {
          const { runInventoryTx } = require('@/lib/db/transaction');
          result = await runInventoryTx(this.prisma, async (tx: any) => {
             return await processor(tx, data);
          }, `WEBHOOK_${source}`);
      } else {
          result = await processor(this.prisma, data); 
      }

      await this.prisma.idempotencyRecord.update({
        where: uniqueWhere,
        data: {
          status: 'COMPLETED',
          responseBody: JSON.parse(JSON.stringify(result || {}))
        }
      });

      return { status: 'SUCCESS', result };
    } catch (error: any) {
      await this.prisma.idempotencyRecord.update({
        where: uniqueWhere,
        data: {
          status: 'FAILED',
          responseBody: { error: error.message }
        }
      });
      throw error;
    }
  }
}
