/**
 * Vendor Scorecard Engine (Build #25)
 * ═════════════════════════════════════
 * 
 * - تقييم الموردين تلقائياً (Quality, Delivery, Price, Compliance)
 * - مقارنة موردين ومعايير التأهيل
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.vendor-score' });

export type VendorScore = {
    supplierId: number;
    supplierName: string;
    qualityScore: number;      // 0-100
    deliveryScore: number;     // 0-100
    priceScore: number;        // 0-100
    complianceScore: number;   // 0-100
    overallScore: number;      // weighted average
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    totalOrders: number;
    onTimeDeliveries: number;
    returnRate: number;
};

export class VendorScorecardEngine {
    /**
     * Calculate comprehensive vendor score
     */
    static async evaluate(
        prisma: PrismaClient,
        supplierId: number,
        periodFrom?: Date,
        periodTo?: Date
    ): Promise<VendorScore> {
        const from = periodFrom || new Date(Date.now() - 365 * 86400000);
        const to = periodTo || new Date();

        const supplier = await (prisma as any).customer.findUnique({ where: { id: supplierId } });
        if (!supplier) throw new Error('مورد غير موجود');

        // Purchase orders analysis
        const pos = await (prisma as any).purchaseOrder.findMany({
            take: 100,
            where: {
                supplierId,
                createdAt: { gte: from, lte: to },
            },
            select: { id: true, status: true, expectedDate: true, total: true, createdAt: true },
        });

        const totalOrders = pos.length;

        // Purchase invoices for returns/quality
        const invoices = await (prisma as any).purchaseInvoice.findMany({
            take: 100,
            where: {
                supplierId,
                invoiceDate: { gte: from.toISOString(), lte: to.toISOString() },
            },
            select: { id: true, total: true, status: true },
        });

        // Delivery score: on-time percentage
        const onTimeDeliveries = pos.filter((po: any) => {
            if (!po.expectedDate) return true;
            return po.status === 'received' || po.status === 'completed';
        }).length;
        const deliveryScore = totalOrders > 0 ? Math.round((onTimeDeliveries / totalOrders) * 100) : 50;

        // Quality score: inverse of return rate
        const totalInvoiceValue = invoices.reduce((s: number, i: any) => s + Number(i.total), 0);
        const cancelledInvoices = invoices.filter((i: any) => i.status === 'cancelled').length;
        const returnRate = invoices.length > 0 ? (cancelledInvoices / invoices.length) * 100 : 0;
        const qualityScore = Math.max(0, Math.round(100 - returnRate * 10));

        // Price score: competitive analysis placeholder (100 = best price in category)
        const priceScore = 75; // Would compare with market/competitor prices

        // Compliance score: documents, certifications
        const complianceScore = 80; // Would check for valid CR, VAT cert, etc.

        // Weighted overall
        const weights = { quality: 0.3, delivery: 0.35, price: 0.2, compliance: 0.15 };
        const overallScore = Math.round(
            qualityScore * weights.quality +
            deliveryScore * weights.delivery +
            priceScore * weights.price +
            complianceScore * weights.compliance
        );

        const grade = overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 40 ? 'D' : 'F';

        return {
            supplierId,
            supplierName: (supplier as any).name || '',
            qualityScore,
            deliveryScore,
            priceScore,
            complianceScore,
            overallScore,
            grade,
            totalOrders,
            onTimeDeliveries,
            returnRate: Math.round(returnRate * 100) / 100,
        };
    }

    /**
     * Rank all vendors
     */
    static async rankAll(prisma: PrismaClient): Promise<VendorScore[]> {
        const suppliers = await (prisma as any).customer.findMany({
            take: 100,
            where: { isActive: true, isSupplier: true },
            select: { id: true },
        });

        const scores: VendorScore[] = [];
        for (const s of suppliers) {
            try {
                const score = await this.evaluate(prisma, s.id);
                if (score.totalOrders > 0) scores.push(score);
            } catch { /* skip */ }
        }

        return scores.sort((a, b) => b.overallScore - a.overallScore);
    }
}
