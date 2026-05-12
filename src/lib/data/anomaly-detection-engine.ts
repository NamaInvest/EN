/**
 * Anomaly Detection Engine (Phase 63 - AI & Analytics)
 * ──────────────────────────────────────────────────────────
 * Scans financial and operational data for statistical outliers (Z-Score)
 * and potential fraud patterns (e.g., unusual discounts, round-number invoices).
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'AnomalyDetectionEngine' });

export interface AnomalyAlert {
    type: 'SALES_DISCOUNT' | 'LARGE_CASH_TRX' | 'OVERTIME_SPIKE' | 'PRICE_SPIKE';
    severity: 'WARNING' | 'CRITICAL';
    message: string;
    transactionId?: string;
    amount?: number;
}

export class AnomalyDetectionEngine {

    /**
     * Scans recent invoices for unusual discounts (Z-score based).
     */
    static async scanSalesDiscounts(tenantId: string): Promise<AnomalyAlert[]> {
        try {
            log.info(`Scanning sales for anomalous discounts for tenant ${tenantId}...`);
            const alerts: AnomalyAlert[] = [];

            const p = prisma as any;
            if (!p.invoice) return [];

            // Get last 100 invoices
            const invoices = await p.invoice.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 100
            });

            if (invoices.length < 10) return []; // Not enough data for stats

            // Calculate mean and stddev of discount percentage
            let totalDiscountPct = 0;
            const discounts: number[] = [];

            for (const inv of invoices) {
                const total = new Decimal(inv.totalAmount || 0);
                const discount = new Decimal(inv.discountAmount || 0);
                
                if (total.greaterThan(0)) {
                    const pct = discount.div(total.plus(discount)).mul(100).toNumber();
                    discounts.push(pct);
                    totalDiscountPct += pct;
                }
            }

            const mean = totalDiscountPct / discounts.length;
            const variance = discounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / discounts.length;
            const stdDev = Math.sqrt(variance);

            // Find anomalies (Z-score > 3)
            for (let i = 0; i < invoices.length; i++) {
                const inv = invoices[i];
                const pct = discounts[i];
                
                if (pct !== undefined) {
                    const zScore = stdDev > 0 ? (pct - mean) / stdDev : 0;
                    
                    if (zScore > 3 && pct > 10) { // Z > 3 AND discount > 10%
                        alerts.push({
                            type: 'SALES_DISCOUNT',
                            severity: 'WARNING',
                            message: `Unusually high discount of ${pct.toFixed(1)}% detected (Z-Score: ${zScore.toFixed(2)})`,
                            transactionId: inv.id,
                            amount: inv.discountAmount
                        });
                    }
                }
            }

            if (alerts.length > 0) {
                log.warn(`Found ${alerts.length} sales anomalies.`);
            }

            return alerts;

        } catch (error: any) {
            log.error('Failed to scan sales anomalies', { error: error.message });
            return [];
        }
    }

    /**
     * Quick check for large round-number cash transactions (potential money laundering/fraud).
     */
    static checkRoundNumberTransaction(amount: number): boolean {
        // e.g., 50000.00 exactly
        return amount > 10000 && amount % 1000 === 0;
    }
}
