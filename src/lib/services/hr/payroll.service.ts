import { PrismaClient } from '@prisma/client';
import { assertTenant } from '../../tenant/tenant-guard';

export type FinancialTxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface PayrollRunPayload {
  tenantId: string;
  runId: number;
  totalAmount: number;
  payrollDate: Date;
  idempotencyKey: string;
}

export class PayrollService {
  /**
   * Process a payroll run securely within a financial transaction.
   */
  static async processPayroll(tx: FinancialTxClient, payload: PayrollRunPayload) {
    assertTenant(payload.tenantId);

    // Verify idempotency
    const existing = await tx.idempotencyRecord.findUnique({
      where: {
        tenantId_endpoint_key: {
          tenantId: payload.tenantId,
          endpoint: 'PAYROLL_RUN',
          key: payload.idempotencyKey
        }
      }
    });

    if (existing) {
      return { status: 'ALREADY_PROCESSED', runId: payload.runId };
    }

    // Record idempotency
    await tx.idempotencyRecord.create({
      data: {
        tenantId: payload.tenantId,
        endpoint: 'PAYROLL_RUN',
        key: payload.idempotencyKey,
        requestHash: payload.idempotencyKey,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    });
    
    return { status: 'PROCESSED', runId: payload.runId };
  }
}
