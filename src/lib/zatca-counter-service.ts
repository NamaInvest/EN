import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * ZATCA Phase 2 Counter & Chain Service
 * Ensures cryptographic integrity of the ICV (Invoice Counter Value) and PIH (Previous Invoice Hash) chain.
 */
export class ZATCACounterService {
  /**
   * Safely increments and retrieves the next Invoice Counter Value (ICV) for a specific tenant.
   * Uses Serializable isolation to prevent race conditions during concurrent invoice generation.
   */
  static async getNextICV(tenantId: string): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      const setting = await tx.setting.findUnique({
        where: { key: `zatca_icv_${tenantId}` },
      });
      
      const nextICV = (Number(setting?.value) || 0) + 1;
      
      await tx.setting.upsert({
        where: { key: `zatca_icv_${tenantId}` },
        update: { value: String(nextICV) },
        create: { tenantId, key: `zatca_icv_${tenantId}`, value: String(nextICV) },
      });
      
      return nextICV;
    }, { isolationLevel: 'Serializable' });
  }

  /**
   * Retrieves the cryptographic hash of the previously cleared/reported invoice.
   * If this is the first invoice, returns the standard ZATCA '0' hash string.
   */
  static async getPreviousHash(tenantId: string): Promise<string> {
    const lastInvoice = await prisma.salesInvoice.findFirst({
      where: { 
        tenantId, 
        cleared: true,
        zatcaHash: { not: null }
      },
      orderBy: { zatcaIcv: 'desc' },
      select: { zatcaHash: true },
    });
    
    // As per ZATCA Phase 2 spec, the first invoice uses a base64 encoded string of 32 zeros
    if (!lastInvoice || !lastInvoice.zatcaHash) {
      return Buffer.from('0'.repeat(32), 'utf8').toString('base64');
    }

    return lastInvoice.zatcaHash;
  }

  /**
   * Generates a new SHA-256 hash for the current invoice XML.
   */
  static generateInvoiceHash(xmlContent: string): string {
    return crypto.createHash('sha256').update(xmlContent).digest('base64');
  }
}
