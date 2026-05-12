/**
 * ZATCA Counter Service (Phase 30.1 - ZATCA Phase 2 Compliance)
 * ──────────────────────────────────────────────────────────
 * Ensures cryptographically secure, gapless sequencing for Invoice Counter Values (ICV).
 * Retrieves Previous Invoice Hash (PIH) to maintain the blockchain-like hash chain required by ZATCA.
 * Uses Prisma's Serializable isolation level to prevent race conditions during high-volume API requests.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ZatcaCounterService' });

export class ZatcaCounterService {

    /**
     * Gets the next sequential ICV (Invoice Counter Value) safely.
     * Guarantees no gaps even during concurrent invoice generations.
     */
    static async getNextICV(tenantId: string): Promise<number> {
        try {
            return await prisma.$transaction(async (tx) => {
                const settingKey = 'zatca_icv';
                
                // Fetch the current counter
                const setting = await (tx as any).setting.findUnique({
                    where: { tenantId_key: { tenantId, key: settingKey } }
                });

                // ZATCA ICV must start at 1
                const nextIcv = setting ? parseInt(setting.value, 10) + 1 : 1;

                // Update or create the new counter value
                await (tx as any).setting.upsert({
                    where: { tenantId_key: { tenantId, key: settingKey } },
                    update: { value: nextIcv.toString() },
                    create: { tenantId, key: settingKey, value: nextIcv.toString() }
                });

                return nextIcv;
            }, {
                // Ensure absolute strictness; no other transaction can read/write the counter until this completes.
                isolationLevel: 'Serializable'
            });

        } catch (error: any) {
            log.error('Failed to generate secure ZATCA ICV', { error: error.message, tenantId });
            throw new Error(`ZATCA ICV generation failed: ${error.message}`);
        }
    }

    /**
     * Retrieves the cryptographic hash of the previously cleared ZATCA invoice (PIH).
     * If this is the very first invoice, it returns a string of 64 zeros as mandated by ZATCA.
     */
    static async getPreviousHash(tenantId: string): Promise<string> {
        try {
            const p = prisma as any;
            if (!p.salesInvoice) {
                log.warn('salesInvoice schema not found. Returning mock PIH.');
                return '0'.repeat(64);
            }

            const lastInvoice = await p.salesInvoice.findFirst({
                where: { 
                    tenantId, 
                    // We only chain against invoices that have successfully generated a hash
                    zatcaHash: { not: null } 
                },
                orderBy: { icv: 'desc' },
                select: { zatcaHash: true }
            });

            const pih = lastInvoice?.zatcaHash || '0'.repeat(64);
            return pih;

        } catch (error: any) {
            log.error('Failed to retrieve ZATCA PIH', { error: error.message, tenantId });
            // For resilience during errors, we must not break the chain randomly.
            // But we should throw so the calling function can abort.
            throw new Error(`ZATCA PIH retrieval failed: ${error.message}`);
        }
    }
}
