import { describe, it, expect, beforeEach } from 'vitest';
import { FixedAssetService } from '../../../../src/services/fa/fixed-asset.service';
import { Prisma } from '@prisma/client';

describe('FixedAssetService', () => {
  let service: FixedAssetService;

  beforeEach(() => {
    // Mock prisma and context
    const mockPrisma = {} as any;
    const mockCtx = {
      tenant: { id: 'tenant-1' },
      user: { id: 'user-1' },
      requirePermission: () => true,
    } as any;

    service = new FixedAssetService(mockPrisma, mockCtx);
  });

  describe('calculateDepreciationExpense', () => {
    it('should calculate straight-line depreciation correctly for a full year', () => {
      const asset = {
        acquisitionCost: 10000,
        accumulatedDepreciation: 0,
        accumulatedImpairment: 0,
        salvageValue: 1000,
        depreciationMethod: 'STRAIGHT_LINE',
        usefulLifeYears: 5,
      };

      // 1 full year: 365.25 days
      const start = new Date('2026-01-01');
      const end = new Date('2027-01-01'); // approx 1 year

      const expense = service.calculateDepreciationExpense(asset, start, end);
      
      // (10000 - 1000) / 5 = 1800
      expect(expense).toBeCloseTo(1800, -1);
    });

    it('should calculate declining balance correctly for a full year', () => {
      const asset = {
        acquisitionCost: 10000,
        accumulatedDepreciation: 2000, // already depreciated a bit
        accumulatedImpairment: 0,
        salvageValue: 1000,
        depreciationMethod: 'DECLINING_BALANCE',
        usefulLifeYears: 5,
        declineRate: 0.4, // Double declining (2/5)
      };

      const start = new Date('2026-01-01');
      const end = new Date('2027-01-01');

      const expense = service.calculateDepreciationExpense(asset, start, end);
      
      // Book value = 8000
      // Rate = 0.4 -> 8000 * 0.4 = 3200
      expect(expense).toBeCloseTo(3200, -1);
    });

    it('should not depreciate below salvage value', () => {
      const asset = {
        acquisitionCost: 10000,
        accumulatedDepreciation: 8500,
        accumulatedImpairment: 0,
        salvageValue: 1000,
        depreciationMethod: 'STRAIGHT_LINE',
        usefulLifeYears: 5,
      };

      const start = new Date('2026-01-01');
      const end = new Date('2027-01-01');

      const expense = service.calculateDepreciationExpense(asset, start, end);
      
      // Book value is 1500. Salvage is 1000. Maximum expense allowed is 500.
      // Normal straight line is 1800, but cap should limit to 500.
      expect(expense).toBe(500);
    });

    it('should return 0 if already at salvage value', () => {
      const asset = {
        acquisitionCost: 10000,
        accumulatedDepreciation: 9000,
        accumulatedImpairment: 0,
        salvageValue: 1000,
        depreciationMethod: 'STRAIGHT_LINE',
        usefulLifeYears: 5,
      };

      const start = new Date('2026-01-01');
      const end = new Date('2027-01-01');

      const expense = service.calculateDepreciationExpense(asset, start, end);
      expect(expense).toBe(0);
    });

    it('should return 0 for CWIP or NO_DEPRECIATION', () => {
      const asset = {
        acquisitionCost: 10000,
        accumulatedDepreciation: 0,
        accumulatedImpairment: 0,
        salvageValue: 1000,
        depreciationMethod: 'NO_DEPRECIATION',
        usefulLifeYears: 5,
      };

      const start = new Date('2026-01-01');
      const end = new Date('2027-01-01');

      const expense = service.calculateDepreciationExpense(asset, start, end);
      expect(expense).toBe(0);
    });
  });
});
