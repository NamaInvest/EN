import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountDeterminationService } from '../../../../src/services/gl/account-determination.service';

describe('AccountDeterminationService', () => {
  let service: AccountDeterminationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      fixedAssetCategory: {
        findUnique: vi.fn(),
      },
      setting: {
        findFirst: vi.fn(),
      },
      account: {
        count: vi.fn(),
      }
    };

    const mockCtx = {
      tenant: { id: 'tenant-1' },
      user: { id: 'user-1' },
      requirePermission: () => true,
      fiscal: { isClosed: false },
    } as any;

    service = new AccountDeterminationService(mockPrisma, mockCtx);
  });

  describe('resolveAccount', () => {
    it('should resolve account from category override', async () => {
      mockPrisma.fixedAssetCategory.findUnique.mockResolvedValue({
        id: 1,
        assetAccountId: 1001,
      });

      const accountId = await service.resolveAccount('ASSET_COST', { categoryId: 1 });
      expect(accountId).toBe(1001);
      expect(mockPrisma.fixedAssetCategory.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should fallback to global settings if category has no override', async () => {
      mockPrisma.fixedAssetCategory.findUnique.mockResolvedValue({
        id: 1,
        assetAccountId: null, // No override
      });

      mockPrisma.setting.findFirst.mockResolvedValue({
        key: 'GL_DEFAULT_ASSET_COST',
        value: '9999',
      });

      const accountId = await service.resolveAccount('ASSET_COST', { categoryId: 1 });
      expect(accountId).toBe(9999);
      expect(mockPrisma.setting.findFirst).toHaveBeenCalled();
    });

    it('should resolve from global settings if no context is provided', async () => {
      mockPrisma.setting.findFirst.mockResolvedValue({
        key: 'GL_DEFAULT_SALES_REVENUE',
        value: '4001',
      });

      const accountId = await service.resolveAccount('SALES_REVENUE');
      expect(accountId).toBe(4001);
    });

    it('should throw if no global setting exists and no override exists', async () => {
      mockPrisma.setting.findFirst.mockResolvedValue(null);

      await expect(service.resolveAccount('SALES_REVENUE')).rejects.toThrow(/ACCOUNT_DETERMINATION_FAILED/);
    });
  });

  describe('validateAccounts', () => {
    it('should return true if all accounts are valid and active', async () => {
      mockPrisma.account.count.mockResolvedValue(2);
      
      const isValid = await service.validateAccounts([1001, 1002]);
      expect(isValid).toBe(true);
      expect(mockPrisma.account.count).toHaveBeenCalledWith({
        where: { id: { in: [1001, 1002] }, tenantId: 'tenant-1', isActive: true }
      });
    });

    it('should throw error if any account is invalid or inactive', async () => {
      mockPrisma.account.count.mockResolvedValue(1); // Only 1 out of 2 found
      
      await expect(service.validateAccounts([1001, 1002])).rejects.toThrow(/GL_VALIDATION_FAILED/);
    });
  });
});
