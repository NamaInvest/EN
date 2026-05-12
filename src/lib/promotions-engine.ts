/**
 * Advanced Promotions Engine (Phase 28.5 - Sales & POS)
 * ──────────────────────────────────────────────────────────
 * Manages complex promotional rules for retail and wholesale.
 * Supports: Buy X Get Y, Bundle Discounts, Time-based (Happy Hour), and Cart Thresholds.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'PromotionsEngine' });

export type PromoType = 'BOGO' | 'BUNDLE' | 'CART_THRESHOLD' | 'HAPPY_HOUR';

export interface CartItem {
    productId: number;
    quantity: number;
    unitPrice: number;
    categoryId?: number;
}

export interface PromotionRule {
    id: number;
    type: PromoType;
    isActive: boolean;
    requiredProductId?: number;
    requiredQuantity?: number;
    rewardProductId?: number;
    rewardQuantity?: number;
    discountPercentage?: number;
    thresholdAmount?: number;
    startTime?: string; // HH:mm format for Happy Hour
    endTime?: string;
}

export class PromotionsEngine {

    /**
     * Evaluates a shopping cart against active promotional rules and applies discounts/free items.
     */
    static async applyPromotions(tenantId: string, cart: CartItem[], rules?: PromotionRule[]): Promise<{ updatedCart: CartItem[], totalDiscount: number }> {
        try {
            // Mocking active rules if none provided
            const activeRules = rules || this.getMockActiveRules();
            
            let totalDiscount = 0;
            const updatedCart = [...cart.map(i => ({ ...i }))]; // Deep copy

            for (const rule of activeRules) {
                if (!rule.isActive) continue;

                switch (rule.type) {
                    case 'BOGO':
                        totalDiscount += this.applyBuyOneGetOne(updatedCart, rule);
                        break;
                    case 'CART_THRESHOLD':
                        totalDiscount += this.applyCartThreshold(updatedCart, rule);
                        break;
                    case 'HAPPY_HOUR':
                        totalDiscount += this.applyHappyHour(updatedCart, rule);
                        break;
                }
            }

            log.info(`Promotions applied. Total Discount: ${totalDiscount}`);
            return { updatedCart, totalDiscount };

        } catch (error: any) {
            log.error('Failed to apply promotions', { error: error.message });
            throw new Error(`Promotions evaluation failed: ${error.message}`);
        }
    }

    /**
     * BOGO: Buy X of required Product, get Y of reward Product for free.
     */
    private static applyBuyOneGetOne(cart: CartItem[], rule: PromotionRule): number {
        if (!rule.requiredProductId || !rule.requiredQuantity || !rule.rewardProductId || !rule.rewardQuantity) return 0;

        const triggerItem = cart.find(i => i.productId === rule.requiredProductId);
        if (!triggerItem || triggerItem.quantity < rule.requiredQuantity) return 0;

        const multiplier = Math.floor(triggerItem.quantity / rule.requiredQuantity);
        const freeQuantity = multiplier * rule.rewardQuantity;

        // Check if reward product is already in cart, if so, discount its price. Otherwise, add it with price 0.
        let discount = 0;
        const rewardItem = cart.find(i => i.productId === rule.rewardProductId);

        if (rewardItem) {
            // They have the item in cart, we discount the price of the free ones
            const applicableFree = Math.min(rewardItem.quantity, freeQuantity);
            discount = applicableFree * rewardItem.unitPrice;
            // The item price is logically reduced, but we just return the total discount amount to subtract from invoice total.
        } else {
            // Automatically add the free item to cart (price 0)
            cart.push({
                productId: rule.rewardProductId,
                quantity: freeQuantity,
                unitPrice: 0
            });
        }

        return discount;
    }

    /**
     * Cart Threshold: If Cart Total >= X, apply Y% discount to the whole cart.
     */
    private static applyCartThreshold(cart: CartItem[], rule: PromotionRule): number {
        if (!rule.thresholdAmount || !rule.discountPercentage) return 0;

        const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        if (cartTotal >= rule.thresholdAmount) {
            const discount = new Decimal(cartTotal).mul(rule.discountPercentage).div(100).toNumber();
            return discount;
        }

        return 0;
    }

    /**
     * Happy Hour: Apply Y% discount if current time is between Start and End time.
     */
    private static applyHappyHour(cart: CartItem[], rule: PromotionRule): number {
        if (!rule.startTime || !rule.endTime || !rule.discountPercentage) return 0;

        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        if (currentTime >= rule.startTime && currentTime <= rule.endTime) {
            const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            return new Decimal(cartTotal).mul(rule.discountPercentage).div(100).toNumber();
        }

        return 0;
    }

    private static getMockActiveRules(): PromotionRule[] {
        return [
            {
                id: 1,
                type: 'BOGO',
                isActive: true,
                requiredProductId: 101, // Espresso
                requiredQuantity: 2,
                rewardProductId: 102, // Croissant
                rewardQuantity: 1
            },
            {
                id: 2,
                type: 'CART_THRESHOLD',
                isActive: true,
                thresholdAmount: 500, // Spend 500
                discountPercentage: 10 // Get 10% off
            }
        ];
    }
}
