import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaterialIssuanceEngine } from '../src/lib/material-issuance';

describe('MaterialIssuanceEngine - Unit Tests with Tenant Isolation & Idempotency', () => {
    let mockPrisma: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Construct a generic deep mock for prisma client context
        mockPrisma = {
            manufacturingOrder: {
                findFirst: vi.fn(),
                updateMany: vi.fn()
            },
            product: {
                findFirst: vi.fn(),
                updateMany: vi.fn()
            },
            productStock: {
                findFirst: vi.fn(),
                updateMany: vi.fn(),
                create: vi.fn()
            },
            stockMovement: {
                create: vi.fn()
            },
            manufacturingCost: {
                create: vi.fn()
            },
            $transaction: vi.fn((callback) => callback(mockPrisma))
        };
    });

    describe('generatePicklist', () => {
        it('should generate picklist successfully when tenant matches', async () => {
            const mockMo = {
                id: 101,
                orderNumber: 'MO-101',
                status: 'draft',
                quantityToProduce: 10,
                tenantId: 'tenant-active',
                recipe: {
                    ingredients: [
                        {
                            rawProductId: 201,
                            quantity: 2,
                            scrapPercentage: 5,
                            rawProduct: {
                                name: 'Raw Material A',
                                currentStock: 100,
                                buyPrice: 50
                            }
                        }
                    ]
                }
            };

            mockPrisma.manufacturingOrder.findFirst.mockResolvedValue(mockMo);

            const result = await MaterialIssuanceEngine.generatePicklist(mockPrisma, 101, 'tenant-active');

            expect(result.moId).toBe(101);
            expect(result.moNumber).toBe('MO-101');
            expect(result.items).toHaveLength(1);
            expect(result.items[0].unitRequired).toBe(21); // 2 * 10 * 1.05
            expect(result.items[0].estimatedCost).toBe(1050); // 50 * 21
        });

        it('should throw an error if the Manufacturing Order belongs to a different tenant', async () => {
            mockPrisma.manufacturingOrder.findFirst.mockResolvedValue(null);

            await expect(
                MaterialIssuanceEngine.generatePicklist(mockPrisma, 101, 'tenant-unauthorized')
            ).rejects.toThrow("Manufacturing Order or Recipe not found for this tenant");
        });

        it('should throw an error if tenantId is missing', async () => {
            await expect(
                MaterialIssuanceEngine.generatePicklist(mockPrisma, 101, '')
            ).rejects.toThrow("Missing tenantId context for generatePicklist");
        });
    });

    describe('executeBackflushing', () => {
        it('should execute backflushing and deduct stock successfully', async () => {
            const mockMo = {
                id: 101,
                orderNumber: 'MO-101',
                status: 'in_progress',
                quantityToProduce: 10,
                tenantId: 'tenant-active',
                recipe: {
                    ingredients: [
                        {
                            rawProductId: 201,
                            quantity: 2
                        }
                    ]
                }
            };

            const mockProduct = {
                id: 201,
                buyPrice: 50,
                tenantId: 'tenant-active'
            };

            const mockProductStock = {
                id: 501,
                productId: 201,
                stockId: 1,
                quantity: 100,
                tenantId: 'tenant-active'
            };

            mockPrisma.manufacturingOrder.findFirst.mockResolvedValue(mockMo);
            mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
            mockPrisma.productStock.findFirst.mockResolvedValue(mockProductStock);

            await MaterialIssuanceEngine.executeBackflushing(
                mockPrisma,
                101, // moId
                5,   // completedQty
                99,  // userId
                1,   // stockId
                'tenant-active'
            );

            // Verify validations
            expect(mockPrisma.manufacturingOrder.findFirst).toHaveBeenCalledWith({
                where: { id: 101, tenantId: 'tenant-active' },
                include: expect.any(Object)
            });

            // Verify stock decrements (qtyToConsume = 2 * 5 = 10)
            expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
                where: { id: 201, tenantId: 'tenant-active' },
                data: { currentStock: { decrement: 10 } }
            });

            expect(mockPrisma.productStock.updateMany).toHaveBeenCalledWith({
                where: { id: 501, tenantId: 'tenant-active' },
                data: { quantity: { decrement: 10 } }
            });

            // Verify stock movement and cost creations
            expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    productId: 201,
                    quantity: 10,
                    type: 'out',
                    tenantId: 'tenant-active'
                })
            });

            expect(mockPrisma.manufacturingCost.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    amount: 500, // 50 * 10
                    costType: 'material',
                    tenantId: 'tenant-active'
                })
            });
        });

        it('should throw an error and block backflushing if the MO is already completed', async () => {
            const mockMo = {
                id: 101,
                status: 'completed',
                tenantId: 'tenant-active',
                recipe: { ingredients: [] }
            };

            mockPrisma.manufacturingOrder.findFirst.mockResolvedValue(mockMo);

            await expect(
                MaterialIssuanceEngine.executeBackflushing(mockPrisma, 101, 5, 99, 1, 'tenant-active')
            ).rejects.toThrow("Cannot perform backflushing: Manufacturing Order status is completed");
        });

        it('should throw an error and block backflushing if the product belongs to another tenant', async () => {
            const mockMo = {
                id: 101,
                status: 'in_progress',
                tenantId: 'tenant-active',
                recipe: {
                    ingredients: [
                        { rawProductId: 201, quantity: 2 }
                    ]
                }
            };

            mockPrisma.manufacturingOrder.findFirst.mockResolvedValue(mockMo);
            mockPrisma.product.findFirst.mockResolvedValue(null); // Simulated tenant mismatch

            await expect(
                MaterialIssuanceEngine.executeBackflushing(mockPrisma, 101, 5, 99, 1, 'tenant-active')
            ).rejects.toThrow("Product not found or unauthorized for tenant: 201");
        });
    });
});
