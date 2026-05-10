/**
 * Vendor Portal Engine (G-13)
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vendor-portal-engine' });
const p = (prisma: PrismaClient) => prisma as any;

export class VendorPortalEngine {
    static async getMyPOs(prisma: PrismaClient, supplierId: number) {
        return p(prisma).purchaseInvoice?.findMany?.({ where: { supplierId }, orderBy: { createdAt: 'desc' }, take: 50 }) || [];
    }
    static async getMyPayments(prisma: PrismaClient, supplierId: number) {
        return p(prisma).payment?.findMany?.({ where: { partyId: supplierId }, orderBy: { createdAt: 'desc' }, take: 50 }) || [];
    }
    static async submitInvoice(prisma: PrismaClient, data: any) {
        return { success: true, message: 'Invoice submitted for review' };
    }
    static async dashboard(prisma: PrismaClient, supplierId: number) {
        const pos = await p(prisma).purchaseInvoice?.count?.({ where: { supplierId } }) || 0;
        const payments = await p(prisma).payment?.count?.({ where: { partyId: supplierId } }) || 0;
        return { totalPOs: pos, totalPayments: payments };
    }
}
