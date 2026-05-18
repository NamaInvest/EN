import { vi } from 'vitest';

/**
 * Enterprise ERP Test Harness
 * Provides a safe, isolated mocking environment for Financial and Security Integration Tests.
 */

export const mockPrisma = {
  $transaction: vi.fn(async (callback) => {
    return callback(mockPrisma);
  }),
  journalEntry: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  payment: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  salesInvoice: {
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  fiscalPeriod: {
    findFirst: vi.fn(),
    update: vi.fn(),
  }
};

export const createTenantContext = (tenantId: string = 'tenant_1') => ({
  tenantId,
  userId: 'user_1',
  role: 'ADMIN'
});

export const simulateRollback = () => {
  mockPrisma.$transaction.mockImplementationOnce(() => {
    return Promise.reject(new Error("Simulated Database Rollback"));
  });
};

export const verifyTenantIsolation = (mockFn: any, expectedTenantId: string) => {
  const calls = mockFn.mock.calls;
  if (calls.length === 0) throw new Error("Function was not called");
  
  for (const call of calls) {
    const args = call[0] || {};
    const hasWhereTenant = args.where && args.where.tenantId;
    const hasDataTenant = args.data && args.data.tenantId;
    
    if (!hasWhereTenant && !hasDataTenant) {
       throw new Error("Tenant isolation violation: tenantId missing from both where and data clauses");
    }
  }
  return true;
};
