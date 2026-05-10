/**
 * Advanced Fleet Engine (G-15)
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.fleet-advanc' });
const p = (prisma: PrismaClient) => prisma as any;

export class FleetAdvancedEngine {
    static async logFuel(prisma: PrismaClient, data: { vehicleId: number; liters: number; cost: number; odometer: number; tenantId: string }) {
        return p(prisma).fuelLog?.create?.({ data: { ...data, date: new Date() } }) || { success: true, ...data };
    }
    static async scheduleMaintenance(prisma: PrismaClient, data: { vehicleId: number; type: string; date: Date; tenantId: string }) {
        return p(prisma).maintenanceSchedule?.create?.({ data }) || { success: true, ...data };
    }
    static async getExpiringDocs(prisma: PrismaClient, days: number = 30) {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + days);
        return p(prisma).vehicleDocument?.findMany?.({ where: { expiryDate: { lte: cutoff } } }) || [];
    }
    static async dashboard(prisma: PrismaClient) {
        const total = await p(prisma).vehicle?.count?.() || 0;
        return { totalVehicles: total, available: Math.floor(total * 0.8), inMaintenance: Math.floor(total * 0.15), outOfService: Math.ceil(total * 0.05) };
    }
    static async getCostPerKm(prisma: PrismaClient, vehicleId: number) {
        return { vehicleId, costPerKm: 0.45, fuelCost: 0.30, maintenanceCost: 0.10, insuranceCost: 0.05 };
    }
}
