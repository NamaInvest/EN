/**
 * Pricing & Billing Engine (Phase 50 - SaaS Product Management)
 * ──────────────────────────────────────────────────────────
 * Manages tenant subscriptions, tiered plans, usage metering, and billing logic.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'PricingBillingEngine' });

export type PlanTier = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface PlanDetails {
    tier: PlanTier;
    monthlyPriceSar: number;
    annualPriceSar: number;
    features: {
        maxUsers: number;
        maxInvoices: number;
        maxBranches: number;
        aiCredits: number;
    };
}

const PLANS: Record<PlanTier, PlanDetails> = {
    STARTER: {
        tier: 'STARTER',
        monthlyPriceSar: 99,
        annualPriceSar: 990,
        features: { maxUsers: 2, maxInvoices: 100, maxBranches: 1, aiCredits: 100 }
    },
    PRO: {
        tier: 'PRO',
        monthlyPriceSar: 299,
        annualPriceSar: 2990,
        features: { maxUsers: 10, maxInvoices: 1000, maxBranches: 3, aiCredits: 1000 }
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        monthlyPriceSar: 999, // Base price
        annualPriceSar: 9990,
        features: { maxUsers: 100, maxInvoices: 100000, maxBranches: 20, aiCredits: 10000 }
    }
};

export class PricingBillingEngine {

    /**
     * Checks if a tenant has exceeded their plan limits for a specific resource.
     */
    static async checkUsageQuota(tenantId: string, resource: 'USERS' | 'INVOICES' | 'BRANCHES' | 'AI_CREDITS', currentUsage: number): Promise<boolean> {
        try {
            log.info(`Checking quota for ${resource} usage: ${currentUsage} (Tenant: ${tenantId})`);
            
            // Assume we fetch the tenant's current plan from DB
            // Mocking plan as PRO for now
            const currentPlanTier: PlanTier = 'PRO'; 
            const planDetails = PLANS[currentPlanTier];

            let limit = 0;
            switch (resource) {
                case 'USERS': limit = planDetails.features.maxUsers; break;
                case 'INVOICES': limit = planDetails.features.maxInvoices; break;
                case 'BRANCHES': limit = planDetails.features.maxBranches; break;
                case 'AI_CREDITS': limit = planDetails.features.aiCredits; break;
            }

            const isWithinLimit = currentUsage < limit;
            if (!isWithinLimit) {
                log.warn(`Tenant ${tenantId} exceeded quota for ${resource}. Limit: ${limit}`);
            }

            return isWithinLimit;

        } catch (error: any) {
            log.error('Failed to check usage quota', { error: error.message });
            throw new Error(`Quota check failed: ${error.message}`);
        }
    }

    /**
     * Calculates the pro-rata upgrade cost when switching from an old plan to a new plan mid-cycle.
     */
    static calculateProRataUpgrade(oldPlanPrice: number, newPlanPrice: number, daysUsed: number, totalDaysInCycle: number = 30): number {
        const daysRemaining = totalDaysInCycle - daysUsed;
        
        const oldPlanDailyRate = new Decimal(oldPlanPrice).div(totalDaysInCycle);
        const newPlanDailyRate = new Decimal(newPlanPrice).div(totalDaysInCycle);

        const unusedOldValue = oldPlanDailyRate.mul(daysRemaining);
        const costOfNewForRemaining = newPlanDailyRate.mul(daysRemaining);

        const amountDue = costOfNewForRemaining.minus(unusedOldValue);
        
        // Cannot be negative (we usually give account credit instead of cash refunds for downgrades)
        return amountDue.greaterThan(0) ? Number(amountDue.toFixed(2)) : 0;
    }
}
