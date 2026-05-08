/**
 * GL Account Determination Service (Phase 2)
 * Ensures accounting integrity by dynamically resolving GL accounts based on 
 * system defaults, categories (Products/Assets/Customers/Suppliers), and overrides.
 */

import { BaseService } from '../shared/base.service';
import { BusinessContext } from '../shared/event-bus.service';
import { PrismaClient } from '@prisma/client';

export type AccountPurpose = 
  | 'ACCOUNTS_RECEIVABLE'
  | 'ACCOUNTS_PAYABLE'
  | 'SALES_REVENUE'
  | 'COGS'
  | 'INVENTORY'
  | 'VAT_OUTPUT'
  | 'VAT_INPUT'
  | 'CASH_MAIN'
  | 'BANK_FEES'
  | 'WHT_PAYABLE'
  | 'SALARY_EXPENSE'
  | 'GOSI_PAYABLE'
  | 'ASSET_COST'
  | 'ASSET_ACCUM_DEP'
  | 'ASSET_DEP_EXPENSE';

export class AccountDeterminationService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Resolve an account by its purpose and optional context entity IDs.
   * If a specific context override exists (e.g. category-level account), it takes precedence.
   */
  async resolveAccount(purpose: AccountPurpose, context?: { 
    categoryId?: number;
    customerId?: number;
    supplierId?: number;
    bankAccountId?: number;
  }): Promise<number> {
    this.requireOpenFiscalPeriod();

    // 1. Check for specific overrides first based on context
    
    // Fixed Asset Category overrides
    if (context?.categoryId) {
      if (['ASSET_COST', 'ASSET_ACCUM_DEP', 'ASSET_DEP_EXPENSE'].includes(purpose)) {
        const category = await this.prisma.fixedAssetCategory.findUnique({
          where: { id: context.categoryId }
        });
        
        if (category) {
          if (purpose === 'ASSET_COST' && category.assetAccountId) return category.assetAccountId;
          if (purpose === 'ASSET_ACCUM_DEP' && category.accumDepAccountId) return category.accumDepAccountId;
          if (purpose === 'ASSET_DEP_EXPENSE' && category.depExpenseAccountId) return category.depExpenseAccountId;
        }
      }
    }

    // Bank Account overrides (Pending schema update for bank GL accounts)

    // 2. Fallback to System Global Settings
    const settingKey = `GL_DEFAULT_${purpose}`;
    const setting = await this.prisma.setting.findFirst({
      where: { tenantId: this.tenantId, key: settingKey }
    });

    if (setting?.value) {
      const accountId = parseInt(setting.value, 10);
      if (!isNaN(accountId)) {
        return accountId;
      }
    }

    throw new Error(`ACCOUNT_DETERMINATION_FAILED: Could not resolve account for purpose '${purpose}'. Please check GL defaults or category mappings.`);
  }

  /**
   * Verifies that the resolved accounts exist and are active in the Chart of Accounts.
   */
  async validateAccounts(accountIds: number[]): Promise<boolean> {
    const validAccounts = await this.prisma.account.count({
      where: {
        id: { in: accountIds },
        tenantId: this.tenantId,
        isActive: true
      }
    });

    if (validAccounts !== accountIds.length) {
      throw new Error(`GL_VALIDATION_FAILED: One or more accounts are invalid, inactive, or do not belong to the current tenant.`);
    }

    return true;
  }
}
