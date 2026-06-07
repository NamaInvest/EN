/**
 * Seed plan definitions and factories documentation for the isolated test DB harness.
 * Contains no active database writes.
 */

export interface TestTenantPlan {
  id: string;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface TestUserPlan {
  id: number;
  role: string;
  email: string;
  tenantId: string;
  permissions: string[];
}

export interface SeedPlan {
  groupName: 'GROUP_A_FINANCE' | 'GROUP_B_SALES' | 'GROUP_C_INVENTORY' | 'GROUP_D_PURCHASES';
  tenant: TestTenantPlan;
  users: TestUserPlan[];
  data: Record<string, any[]>;
}

export function buildSeedPlanOnly(groupName: SeedPlan['groupName'], tenantSlug: string): SeedPlan {
  const mockTenantId = `tenant_${tenantSlug}_mock_123`;
  
  return {
    groupName,
    tenant: {
      id: mockTenantId,
      slug: tenantSlug,
      name: `Mock Company for ${groupName}`,
      status: 'ACTIVE'
    },
    users: [
      {
        id: 1001,
        role: groupName === 'GROUP_A_FINANCE' ? 'CFO' : groupName === 'GROUP_B_SALES' ? 'CASHIER' : 'STOREKEEPER',
        email: `tester@${tenantSlug}.com`,
        tenantId: mockTenantId,
        permissions: ['read', 'write']
      }
    ],
    data: getInitialGroupData(groupName, mockTenantId)
  };
}

function getInitialGroupData(groupName: SeedPlan['groupName'], tenantId: string): Record<string, any[]> {
  switch (groupName) {
    case 'GROUP_A_FINANCE':
      return {
        accounts: [
          { code: '110101', name: 'Cash in Hand', type: 'ASSET', tenantId },
          { code: '110102', name: 'Bank Account', type: 'ASSET', tenantId }
        ],
        fiscalPeriods: [
          { startDate: '2026-01-01', endDate: '2026-12-31', status: 'OPEN', tenantId }
        ]
      };
    case 'GROUP_B_SALES':
      return {
        customers: [
          { id: 1, name: 'Customer A', tenantId }
        ],
        products: [
          { id: 1, name: 'Product A', price: 100, taxRate: 15, tenantId }
        ]
      };
    case 'GROUP_C_INVENTORY':
      return {
        warehouses: [
          { id: 'wh_src', name: 'Source Warehouse', tenantId },
          { id: 'wh_dest', name: 'Destination Warehouse', tenantId }
        ],
        stockBalances: [
          { productId: 1, warehouseId: 'wh_src', quantity: 150, tenantId }
        ]
      };
    case 'GROUP_D_PURCHASES':
      return {
        suppliers: [
          { id: 1, name: 'Supplier A', tenantId }
        ],
        purchaseInvoices: [
          { id: 7001, supplierId: 1, total: 50000, tenantId }
        ]
      };
    default:
      return {};
  }
}
