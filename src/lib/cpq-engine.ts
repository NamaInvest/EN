/**
 * CPQ Engine — Configure-Price-Quote (Build #21)
 * ═══════════════════════════════════════════════
 * 
 * - تكوين منتجات مركّبة ديناميكياً
 * - تسعير متدرج (Volume/Tiered/Bundle)
 * - إنشاء عروض أسعار PDF
 */

import type { PrismaClient } from '@prisma/client';

const db = (p: any) => p as any;

export type PricingRule = {
    type: 'VOLUME' | 'TIERED' | 'BUNDLE' | 'CUSTOMER_SPECIFIC';
    minQty?: number;
    maxQty?: number;
    discount?: number;      // percentage
    fixedPrice?: number;    // override
    customerId?: number;
};

export type QuoteLine = {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
    configOptions?: Record<string, string>;
};

export class CPQEngine {
    /**
     * Calculate dynamic price based on rules
     */
    static async calculatePrice(
        prisma: PrismaClient,
        productId: number,
        quantity: number,
        customerId?: number
    ): Promise<{ basePrice: number; finalPrice: number; discount: number; rule: string }> {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('منتج غير موجود');

        const basePrice = Number((product as any).salePrice || (product as any).price || 0);

        // Check customer-specific pricing
        if (customerId) {
            const specific = await db(prisma).customerPrice?.findFirst?.({
                where: { customerId, productId, isActive: true },
            }).catch(() => null);

            if (specific) {
                return {
                    basePrice,
                    finalPrice: Number(specific.price),
                    discount: ((basePrice - Number(specific.price)) / basePrice) * 100,
                    rule: 'CUSTOMER_SPECIFIC',
                };
            }
        }

        // Volume discount tiers
        const tiers = [
            { min: 100, discount: 15 },
            { min: 50, discount: 10 },
            { min: 20, discount: 5 },
            { min: 10, discount: 3 },
        ];

        for (const tier of tiers) {
            if (quantity >= tier.min) {
                const finalPrice = basePrice * (1 - tier.discount / 100);
                return {
                    basePrice,
                    finalPrice: Math.round(finalPrice * 100) / 100,
                    discount: tier.discount,
                    rule: `VOLUME_${tier.min}+`,
                };
            }
        }

        return { basePrice, finalPrice: basePrice, discount: 0, rule: 'LIST_PRICE' };
    }

    /**
     * Build a complete quote with multiple lines
     */
    static async buildQuote(
        prisma: PrismaClient,
        customerId: number,
        lines: Array<{ productId: number; quantity: number; configOptions?: Record<string, string> }>
    ): Promise<{
        customerId: number;
        lines: QuoteLine[];
        subtotal: number;
        vatRate: number;
        vatAmount: number;
        total: number;
        validUntil: string;
    }> {
        const quoteLines: QuoteLine[] = [];

        for (const line of lines) {
            const product = await prisma.product.findUnique({ where: { id: line.productId } });
            if (!product) continue;

            const pricing = await this.calculatePrice(prisma, line.productId, line.quantity, customerId);
            const lineTotal = pricing.finalPrice * line.quantity;

            quoteLines.push({
                productId: line.productId,
                productName: (product as any).name || '',
                quantity: line.quantity,
                unitPrice: pricing.finalPrice,
                discount: pricing.discount,
                lineTotal: Math.round(lineTotal * 100) / 100,
                configOptions: line.configOptions,
            });
        }

        const subtotal = quoteLines.reduce((s, l) => s + l.lineTotal, 0);
        const vatRate = 0.15; // Saudi VAT 15%
        const vatAmount = Math.round(subtotal * vatRate * 100) / 100;

        return {
            customerId,
            lines: quoteLines,
            subtotal: Math.round(subtotal * 100) / 100,
            vatRate,
            vatAmount,
            total: Math.round((subtotal + vatAmount) * 100) / 100,
            validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        };
    }

    /**
     * Convert quote to sales order
     */
    static async convertToSalesOrder(
        prisma: PrismaClient,
        quoteId: number
    ): Promise<any> {
        const quote = await db(prisma).salesQuote?.findUnique?.({
            where: { id: quoteId },
            include: { lines: true },
        });
        if (!quote) throw new Error('عرض سعر غير موجود');

        // Create sales order from quote
        const order = await db(prisma).salesOrder?.create?.({
            data: {
                customerId: quote.customerId,
                quoteId: quote.id,
                status: 'DRAFT',
                total: quote.total,
                notes: `تم التحويل من عرض سعر رقم ${quote.id}`,
            },
        });

        // Update quote status
        await db(prisma).salesQuote?.update?.({
            where: { id: quoteId },
            data: { status: 'CONVERTED' },
        });

        return order;
    }
}
