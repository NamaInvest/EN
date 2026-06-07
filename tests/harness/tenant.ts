import { vi } from 'vitest';

export interface MockTenantContext {
  tenantId: string;
  name: string;
  status: string;
}

export function createMockTenantContext(overrides: Partial<MockTenantContext> = {}): MockTenantContext {
  return {
    tenantId: 'tenant_mock_456',
    name: 'Mock Company',
    status: 'ACTIVE',
    ...overrides
  };
}

export function verifyTenantIsolation(prismaMockFn: any, expectedTenantId: string) {
  const calls = prismaMockFn.mock.calls;
  if (calls.length === 0) {
    throw new Error('Tenant isolation check failed: No database calls made.');
  }

  for (const call of calls) {
    const args = call[0] || {};
    const tenantIdInWhere = args.where?.tenantId;
    const tenantIdInData = args.data?.tenantId;

    if (tenantIdInWhere !== expectedTenantId && tenantIdInData !== expectedTenantId) {
      throw new Error(
        `Tenant isolation breach: Expected tenantId "${expectedTenantId}" but got where: "${tenantIdInWhere}", data: "${tenantIdInData}"`
      );
    }
  }
  return true;
}
