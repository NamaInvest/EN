import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ZATCA ICV/PIH Chain Service
 *
 * ICV (Invoice Counter Value) must be strictly sequential with no gaps.
 * PIH (Previous Invoice Hash) must chain from the last cleared invoice.
 *
 * NOTE: The Setting model has a single @unique on `key`, not a composite.
 *       We namespace keys per tenant: `zatca_icv_{tenantId}`
 */
export class ZATCACounterService {
  private icvKey(tenantId: string) {
    return `zatca_icv_${tenantId}`;
  }

  /**
   * Get next ICV in a SERIALIZABLE transaction to prevent race conditions
   * under concurrent invoice generation (multi-tenant, multi-user).
   */
  async getNextICV(tenantId: string): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      const key = this.icvKey(tenantId);
      const setting = await tx.setting.findUnique({ where: { key } });
      const next = (Number(setting?.value ?? 0)) + 1;
      await tx.setting.upsert({
        where: { key },
        update: { value: String(next) },
        create: { tenantId, key, value: String(next) },
      });
      return next;
    }, { isolationLevel: 'Serializable' });
  }

  /**
   * PIH = Previous Invoice Hash — chains from the last CLEARED invoice.
   * First invoice uses 64 zero characters per ZATCA specification.
   */
  async getPreviousHash(tenantId: string): Promise<string> {
    const last = await (prisma as any).salesInvoice.findFirst({
      where: { tenantId, zatcaStatus: 'CLEARED' },
      orderBy: { icv: 'desc' },
      select: { zatcaHash: true },
    });
    return last?.zatcaHash ?? '0'.repeat(64);
  }

  /**
   * Verify ICV chain integrity — detects any gaps that would indicate
   * missing or deleted invoices (a compliance violation).
   */
  async verifyChainIntegrity(tenantId: string): Promise<{ isValid: boolean; gaps: number[] }> {
    const invoices = await (prisma as any).salesInvoice.findMany({
      where: { tenantId },
      orderBy: { icv: 'asc' },
      select: { icv: true },
    });
    const gaps: number[] = [];
    for (let i = 1; i < invoices.length; i++) {
      if (invoices[i].icv !== invoices[i - 1].icv + 1) {
        gaps.push(invoices[i - 1].icv + 1);
      }
    }
    return { isValid: gaps.length === 0, gaps };
  }
}
