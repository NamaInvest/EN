/**
 * Loyalty & Rewards Engine (Phase 28.4 - Sales & POS)
 * ──────────────────────────────────────────────────────────
 * Manages Customer Loyalty Programs, Points Accumulation, and Redemptions.
 * Calculates Tier status (Silver, Gold, Platinum) based on annual spend.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'LoyaltyEngine' });

export type LoyaltyTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface PointsEarnRequest {
    customerId: number;
    invoiceId: number;
    totalAmount: number;
    tenantId: string;
}

export interface PointsRedeemRequest {
    customerId: number;
    pointsToRedeem: number;
    invoiceId: number;
    tenantId: string;
}

export class LoyaltyEngine {

    // Mocked standard rules. In production, these are stored in `loyaltyRule` table.
    private static POINTS_PER_SAR = 1; // 1 point for every 1 SAR spent
    private static REDEMPTION_VALUE_PER_POINT = 0.01; // 100 points = 1 SAR

    // Annual Spend Thresholds for Tiers
    private static TIER_THRESHOLDS = {
        SILVER: 5000,
        GOLD: 15000,
        PLATINUM: 50000
    };

    /**
     * Calculates and awards points for a completed sales invoice.
     */
    static async earnPoints(req: PointsEarnRequest): Promise<number> {
        try {
            const p = prisma as any;
            if (!p.customerLoyalty) {
                log.warn('CustomerLoyalty schema not found. Mocking points generation.');
                return req.totalAmount * this.POINTS_PER_SAR;
            }

            const pointsEarned = Math.floor(req.totalAmount * this.POINTS_PER_SAR);

            if (pointsEarned <= 0) return 0;

            await prisma.$transaction(async (tx) => {
                // 1. Get or Create Loyalty Profile
                let loyaltyProfile = await (tx as any).customerLoyalty.findUnique({
                    where: { customerId_tenantId: { customerId: req.customerId, tenantId: req.tenantId } }
                });

                if (!loyaltyProfile) {
                    loyaltyProfile = await (tx as any).customerLoyalty.create({
                        data: {
                            customerId: req.customerId,
                            tenantId: req.tenantId,
                            totalPoints: 0,
                            tier: 'STANDARD',
                            annualSpend: 0
                        }
                    });
                }

                // 2. Add Points Ledger Entry
                await (tx as any).loyaltyTransaction.create({
                    data: {
                        loyaltyId: loyaltyProfile.id,
                        invoiceId: req.invoiceId,
                        pointsAdded: pointsEarned,
                        pointsRedeemed: 0,
                        type: 'EARN',
                        tenantId: req.tenantId
                    }
                });

                // 3. Update Totals and Tier
                const newSpend = new Decimal(loyaltyProfile.annualSpend).plus(req.totalAmount).toNumber();
                const newTier = this.calculateTier(newSpend);

                await (tx as any).customerLoyalty.update({
                    where: { id: loyaltyProfile.id },
                    data: {
                        totalPoints: loyaltyProfile.totalPoints + pointsEarned,
                        annualSpend: newSpend,
                        tier: newTier
                    }
                });

                log.info(`Awarded ${pointsEarned} points to Customer ${req.customerId}. New Tier: ${newTier}`);
            });

            return pointsEarned;

        } catch (error: any) {
            log.error('Failed to earn points', { error: error.message });
            throw new Error(`Loyalty earn failed: ${error.message}`);
        }
    }

    /**
     * Redeems points for a discount on an invoice.
     * Returns the monetary value of the discount.
     */
    static async redeemPoints(req: PointsRedeemRequest): Promise<number> {
        const p = prisma as any;
        if (!p.customerLoyalty) return req.pointsToRedeem * this.REDEMPTION_VALUE_PER_POINT;

        const loyaltyProfile = await p.customerLoyalty.findUnique({
            where: { customerId_tenantId: { customerId: req.customerId, tenantId: req.tenantId } }
        });

        if (!loyaltyProfile || loyaltyProfile.totalPoints < req.pointsToRedeem) {
            throw new Error('Insufficient points balance for redemption');
        }

        const discountValue = new Decimal(req.pointsToRedeem).mul(this.REDEMPTION_VALUE_PER_POINT).toNumber();

        await prisma.$transaction(async (tx) => {
            await (tx as any).loyaltyTransaction.create({
                data: {
                    loyaltyId: loyaltyProfile.id,
                    invoiceId: req.invoiceId,
                    pointsAdded: 0,
                    pointsRedeemed: req.pointsToRedeem,
                    type: 'REDEEM',
                    tenantId: req.tenantId
                }
            });

            await (tx as any).customerLoyalty.update({
                where: { id: loyaltyProfile.id },
                data: { totalPoints: loyaltyProfile.totalPoints - req.pointsToRedeem }
            });

            // Post Accounting Journal Entry (Dr. Loyalty Liability, Cr. Revenue/Discount)
            const settings = await (tx as any).setting.findMany({
                where: { tenantId: req.tenantId, key: { in: ['loyalty_liability_account', 'loyalty_expense_account'] } }
            });

            const liabilityAcc = settings.find((s: any) => s.key === 'loyalty_liability_account')?.value || 208;
            const expenseAcc = settings.find((s: any) => s.key === 'loyalty_expense_account')?.value || 508;

            log.info(`Mocking Journal: Dr. Liability ${liabilityAcc} / Cr. Discount ${expenseAcc} for ${discountValue}`);
        });

        log.info(`Redeemed ${req.pointsToRedeem} points for Customer ${req.customerId} (Value: ${discountValue})`);
        return discountValue;
    }

    private static calculateTier(annualSpend: number): LoyaltyTier {
        if (annualSpend >= this.TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
        if (annualSpend >= this.TIER_THRESHOLDS.GOLD) return 'GOLD';
        if (annualSpend >= this.TIER_THRESHOLDS.SILVER) return 'SILVER';
        return 'STANDARD';
    }
}
