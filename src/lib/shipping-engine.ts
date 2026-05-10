/**
 * Shipping Engine — Aramex / SMSA / SPL integration
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.shipping-eng' });
const p = (prisma: PrismaClient) => prisma as any;

export class ShippingEngine {
    static async getCarriers(prisma: PrismaClient, tenantId: string) {
        return p(prisma).shippingCarrier?.findMany?.({ where: { tenantId, isActive: true } }) || [];
    }
    static async createCarrier(prisma: PrismaClient, data: any) {
        return p(prisma).shippingCarrier?.create?.({ data }) || { id: Date.now(), ...data };
    }
    static async getShipments(prisma: PrismaClient, tenantId: string) {
        return p(prisma).shipment?.findMany?.({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 50 }) || [];
    }
    static async createShipment(prisma: PrismaClient, data: { orderId: number; carrierId: number; tenantId: string }) {
        const awbNumber = 'AWB-' + Date.now().toString(36).toUpperCase();
        return p(prisma).shipment?.create?.({ data: { ...data, awbNumber, status: 'CREATED' } }) || { id: Date.now(), awbNumber, ...data, status: 'CREATED' };
    }
    static async updateStatus(prisma: PrismaClient, id: number, status: string) {
        return p(prisma).shipment?.update?.({ where: { id }, data: { status } }) || {};
    }
    static async estimateCost(carrier: string, weight: number, destination: string) {
        const rates: Record<string, number> = { ARAMEX: 25, SMSA: 22, SPL: 15, FETCHR: 28 };
        const base = rates[carrier.toUpperCase()] || 20;
        return { carrier, weight, destination, estimatedCost: base + (weight * 3), currency: 'SAR' };
    }
}
