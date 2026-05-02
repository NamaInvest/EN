import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StandardCostEngine } from '../src/lib/standard-cost-engine';
import { prisma } from '../src/lib/prisma';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
    prisma: {
        standardCostVersion: {
            findFirst: vi.fn(),
            updateMany: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    }
}));

describe('StandardCostEngine', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate Purchase Price Variance (PPV) correctly (Unfavorable)', async () => {
        // Mock active standard cost: $10 expected
        (prisma.standardCostVersion.findFirst as any).mockResolvedValue({
            id: 1,
            productId: 100,
            materialCost: 10,
            isActive: true
        });

        // Mock transaction
        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            return callback({
                varianceTransaction: { create: vi.fn().mockResolvedValue({ id: 1 }) },
                journalEntry: { create: vi.fn().mockResolvedValue({ id: 100 }) },
                journalLine: { create: vi.fn() }
            });
        });

        // Actual price is $12 (Unfavorable variance of $2 * 50 qty = $100)
        await StandardCostEngine.postPurchasePriceVariance(100, 12, 50, '1');

        expect(prisma.standardCostVersion.findFirst).toHaveBeenCalledWith({
            where: { productId: 100, isActive: true }
        });
        
        expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should not post variance if actual price equals standard price', async () => {
        (prisma.standardCostVersion.findFirst as any).mockResolvedValue({
            id: 1,
            productId: 100,
            materialCost: 10,
            isActive: true
        });

        // Actual price is $10 (Same as standard)
        const result = await StandardCostEngine.postPurchasePriceVariance(100, 10, 50, '1');

        expect(result).toBeNull();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
