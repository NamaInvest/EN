import { calculateVendorScore } from '@/lib/vendor-scoring';

describe('Vendor Scoring Engine', () => {
    it('should calculate a perfect score if all ratings are 5', async () => {
        const mockPrisma = {
            vendorRating: {
                findMany: jest.fn().mockResolvedValue([
                    { quality: 5, delivery: 5, pricing: 5 },
                    { quality: 5, delivery: 5, pricing: 5 }
                ])
            }
        };

        const score = await calculateVendorScore(1, mockPrisma);
        expect(score.quality).toBe(100);
        expect(score.otd).toBe(100);
        expect(score.pricing).toBe(100);
        expect(score.compositeScore).toBe(100);
        expect(score.status).toBe('ACTIVE');
    });

    it('should calculate score accurately for mixed ratings', async () => {
        const mockPrisma = {
            vendorRating: {
                findMany: jest.fn().mockResolvedValue([
                    { quality: 3, delivery: 4, pricing: 5 },
                    { quality: 2, delivery: 2, pricing: 3 }
                ])
            }
        };

        const score = await calculateVendorScore(1, mockPrisma);
        
        // Quality avg = 2.5 -> 50%
        // Delivery avg = 3 -> 60%
        // Pricing avg = 4 -> 80%
        // Composite = (50+60+80) / 3 = 63.33 -> 63
        
        expect(score.quality).toBe(50);
        expect(score.otd).toBe(60);
        expect(score.pricing).toBe(80);
        expect(score.compositeScore).toBe(63);
        expect(score.status).toBe('ACTIVE');
    });

    it('should set status to WARNING if composite score < 60', async () => {
        const mockPrisma = {
            vendorRating: {
                findMany: jest.fn().mockResolvedValue([
                    { quality: 2, delivery: 2, pricing: 2 } // 40% avg
                ])
            }
        };

        const score = await calculateVendorScore(1, mockPrisma);
        expect(score.compositeScore).toBe(40);
        expect(score.status).toBe('WARNING');
    });
});
