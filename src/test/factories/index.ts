export const factories = {
  tenant: (overrides = {}) => ({
    id: 'test-tenant-id',
    name: 'Test Tenant',
    plan: 'pro' as const,
    ...overrides,
  }),

  user: (overrides = {}) => ({
    id: 'test-user-id',
    tenantId: 'test-tenant',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    ...overrides,
  }),

  // Add more factories as needed
};
