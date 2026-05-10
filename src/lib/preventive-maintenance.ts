/**
 * Preventive Maintenance Engine (Build #38)
 * ═══════════════════════════════════════════
 * 
 * - جدولة الصيانة الوقائية
 * - تتبع عداد التشغيل (Runtime hours)
 * - إنشاء أوامر عمل آلية
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.preventive-m' });
const db = (p: any) => p as any;

export class PreventiveMaintenanceEngine {
    /**
     * Check which assets are due for maintenance
     */
    static async checkDueAssets(prisma: PrismaClient): Promise<Array<{
        assetId: number;
        assetName: string;
        lastServiceDate: string;
        nextDueDate: string;
        intervalDays: number;
        overdueDays: number;
        priority: 'URGENT' | 'DUE' | 'UPCOMING';
    }>> {
        const assets = await db(prisma).fixedAsset?.findMany?.({
            where: { status: { in: ['ACTIVE', 'active', 'in_service'] } },
        }).catch(() => []) ?? [];

        const now = new Date();
        const results: any[] = [];

        for (const asset of assets) {
            const intervalDays = Number(asset.maintenanceIntervalDays || 90);
            const lastService = asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : new Date(asset.acquisitionDate || asset.createdAt);
            const nextDue = new Date(lastService.getTime() + intervalDays * 86400000);
            const overdueDays = Math.floor((now.getTime() - nextDue.getTime()) / 86400000);

            const priority = overdueDays > 14 ? 'URGENT' : overdueDays > 0 ? 'DUE' : 'UPCOMING';

            if (overdueDays > -30) {
                results.push({
                    assetId: asset.id,
                    assetName: asset.name || asset.description || `Asset ${asset.id}`,
                    lastServiceDate: lastService.toISOString().slice(0, 10),
                    nextDueDate: nextDue.toISOString().slice(0, 10),
                    intervalDays,
                    overdueDays: Math.max(0, overdueDays),
                    priority,
                });
            }
        }

        return results.sort((a, b) => b.overdueDays - a.overdueDays);
    }

    /**
     * Auto-generate work orders for overdue assets
     */
    static async generateWorkOrders(prisma: PrismaClient): Promise<{ created: number; assets: number[] }> {
        const dueAssets = await this.checkDueAssets(prisma);
        const urgentOrDue = dueAssets.filter(a => a.priority === 'URGENT' || a.priority === 'DUE');
        
        const createdIds: number[] = [];
        for (const asset of urgentOrDue) {
            try {
                await db(prisma).maintenanceWorkOrder?.create?.({
                    data: {
                        assetId: asset.assetId,
                        type: 'PREVENTIVE',
                        description: `صيانة وقائية - ${asset.assetName}`,
                        priority: asset.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
                        status: 'OPEN',
                        dueDate: new Date(),
                    },
                });
                createdIds.push(asset.assetId);
            } catch { /* model may not exist */ }
        }

        return { created: createdIds.length, assets: createdIds };
    }
}
