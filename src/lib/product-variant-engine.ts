// @ts-nocheck
import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'product-variant-engine' });

export class ProductVariantEngine {

    /**
     * Get all variants for a product
     */
    static async getVariants(productId: number) {
        return prisma.productVariant.findMany({
            take: 100,
            where: { parentProductId: productId } as any,
            include: { stock: true }
        });
    }

    /**
     * Create a new variant
     */
    static async createVariant(data: {
        parentProductId: number;
        sku?: string;
        barcode?: string;
        attributes: any; // e.g. { "Size": "M", "Color": "Red" }
        priceOverride?: number;
        costOverride?: number;
        weight?: number;
    }) {
        return prisma.productVariant.create({
            data: {
                parentProductId: data.parentProductId,
                sku: data.sku,
                barcode: data.barcode,
                attributes: JSON.stringify(data.attributes),
                priceOverride: data.priceOverride,
                costOverride: data.costOverride,
                weight: data.weight
            } as any
        });
    }

    /**
     * Update an existing variant
     */
    static async updateVariant(variantId: number, data: any) {
        if (data.attributes) {
            data.attributes = JSON.stringify(data.attributes);
        }
        return prisma.productVariant.update({
            where: { id: variantId },
            data
        });
    }

    /**
     * Delete a variant
     */
    static async deleteVariant(variantId: number) {
        return prisma.productVariant.delete({
            where: { id: variantId }
        });
    }
}
