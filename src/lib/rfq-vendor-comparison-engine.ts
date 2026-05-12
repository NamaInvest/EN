/**
 * RFQ & Vendor Comparison Engine (Phase 29.2 - Purchases)
 * ──────────────────────────────────────────────────────────
 * Manages the Request For Quotation (RFQ) lifecycle.
 * Collects vendor quotes, applies a weighted comparison matrix (Price, Lead Time).
 * Awards the best vendor and prepares for auto-PO generation.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'RfqVendorComparisonEngine' });

export type AwardCriteria = 'LOWEST_PRICE' | 'BEST_LEAD_TIME' | 'BALANCED_MATRIX';

export interface VendorQuoteInput {
    rfqId: number;
    vendorId: number;
    priceTotal: number;
    leadTimeDays: number;
    qualityScore?: number; // History based
    validUntil: Date;
    tenantId: string;
}

export interface QuoteComparisonResult {
    vendorId: number;
    vendorName: string;
    totalScore: number;
    isWinner: boolean;
    metrics: {
        priceScore: number;
        leadTimeScore: number;
    };
}

export class RfqVendorComparisonEngine {

    /**
     * Submits a vendor's quotation in response to an RFQ.
     */
    static async submitQuote(req: VendorQuoteInput): Promise<any> {
        try {
            const p = prisma as any;
            if (!p.vendorQuote) {
                log.warn('VendorQuote table not found. Mocking submission.');
                return { id: Date.now(), ...req, status: 'SUBMITTED' };
            }

            const quote = await p.vendorQuote.create({
                data: {
                    rfqId: req.rfqId,
                    vendorId: req.vendorId,
                    totalAmount: req.priceTotal,
                    leadTimeDays: req.leadTimeDays,
                    validUntil: req.validUntil,
                    status: 'SUBMITTED',
                    tenantId: req.tenantId
                }
            });

            log.info(`Quote submitted by vendor ${req.vendorId} for RFQ ${req.rfqId}`);
            return quote;

        } catch (error: any) {
            log.error('Failed to submit quote', { error: error.message });
            throw new Error(`Quote submission failed: ${error.message}`);
        }
    }

    /**
     * Analyzes all submitted quotes for an RFQ and determines the best vendor based on selected criteria.
     */
    static async compareAndAward(rfqId: number, criteria: AwardCriteria, tenantId: string): Promise<QuoteComparisonResult[]> {
        const p = prisma as any;
        if (!p.vendorQuote) {
            log.warn('Mocking comparison result.');
            return this.generateMockComparison();
        }

        const quotes = await p.vendorQuote.findMany({
            where: { rfqId, tenantId, status: 'SUBMITTED' },
            include: { vendor: { select: { name: true } } }
        });

        if (quotes.length === 0) {
            throw new Error(`No quotes submitted for RFQ ${rfqId}`);
        }

        const lowestPrice = Math.min(...quotes.map((q: any) => q.totalAmount));
        const shortestLeadTime = Math.min(...quotes.map((q: any) => q.leadTimeDays));

        const results: QuoteComparisonResult[] = quotes.map((q: any) => {
            let priceScore = 0;
            let leadTimeScore = 0;
            let totalScore = 0;

            // Normalized Scoring (100 is best)
            priceScore = (lowestPrice / q.totalAmount) * 100;
            leadTimeScore = (shortestLeadTime / q.leadTimeDays) * 100;

            if (criteria === 'LOWEST_PRICE') {
                totalScore = priceScore;
            } else if (criteria === 'BEST_LEAD_TIME') {
                totalScore = leadTimeScore;
            } else if (criteria === 'BALANCED_MATRIX') {
                // 60% Price, 40% Lead Time
                totalScore = (priceScore * 0.6) + (leadTimeScore * 0.4);
            }

            return {
                vendorId: q.vendorId,
                vendorName: q.vendor?.name || `Vendor ${q.vendorId}`,
                totalScore: Number(totalScore.toFixed(2)),
                isWinner: false,
                metrics: {
                    priceScore: Number(priceScore.toFixed(2)),
                    leadTimeScore: Number(leadTimeScore.toFixed(2))
                }
            };
        });

        // Sort descending by total score
        results.sort((a, b) => b.totalScore - a.totalScore);
        
        // Mark winner
        if (results.length > 0) {
            results[0].isWinner = true;
            
            // Auto-update DB states
            await prisma.$transaction(async (tx) => {
                await (tx as any).rfq.update({
                    where: { id: rfqId },
                    data: { status: 'AWARDED', awardedVendorId: results[0].vendorId }
                });

                // Set others to REJECTED
                await (tx as any).vendorQuote.updateMany({
                    where: { rfqId, vendorId: { not: results[0].vendorId } },
                    data: { status: 'REJECTED' }
                });

                // Set winner to AWARDED
                await (tx as any).vendorQuote.updateMany({
                    where: { rfqId, vendorId: results[0].vendorId },
                    data: { status: 'AWARDED' }
                });
            });

            log.info(`RFQ ${rfqId} awarded to Vendor ${results[0].vendorId} based on ${criteria}`);
        }

        return results;
    }

    private static generateMockComparison(): QuoteComparisonResult[] {
        return [
            {
                vendorId: 1,
                vendorName: 'Global Tech Supplies',
                totalScore: 95.5,
                isWinner: true,
                metrics: { priceScore: 100, leadTimeScore: 88.75 }
            },
            {
                vendorId: 2,
                vendorName: 'Fast Parts Logistics',
                totalScore: 82.3,
                isWinner: false,
                metrics: { priceScore: 75.4, leadTimeScore: 100 }
            }
        ];
    }
}
