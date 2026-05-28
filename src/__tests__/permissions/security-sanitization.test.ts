import { NextRequest } from 'next/server';

// ── Mock Dependencies ────────────────────────────────────────────────────────

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      incr: jest.fn().mockResolvedValue(1),
      pexpire: jest.fn().mockResolvedValue(true),
    };
  });
});

jest.mock('@/lib/instrumentation/metrics', () => ({
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    }),
  },
}));

// Mock Auth logic
const mockGetUserFromRequest = jest.fn();
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: mockGetUserFromRequest,
  getTokenFromRequest: jest.fn(),
  verifyToken: jest.fn(),
}));

// Mock Prisma
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockPrismaClient = {
  user: {
    findMany: mockFindMany,
    findUnique: mockFindUnique,
  },
};

jest.mock('@/lib/prisma', () => {
  const original = jest.requireActual('async_hooks');
  const store = new original.AsyncLocalStorage();
  return {
    prisma: mockPrismaClient,
    getPrisma: jest.fn().mockReturnValue(mockPrismaClient),
    resolveTenantContext: jest.fn().mockReturnValue({
      tenantSlug: 'n11',
      tenantId: 'n11-id',
      mode: 'request',
    }),
    currentRequestStore: store,
  };
});

jest.mock('@/lib/governance/tenant-guard', () => ({
  assertTenantContextMatch: jest.fn(), // Bypass match check in mock environment
  TENANT_ISOLATION_ERROR: 'Tenant isolation violation',
}));

// Import route handler after mocking
import { GET } from '@/app/api/settings/roles/route';

describe('Settings Roles API Security Sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should explicitly select only safe fields and omit passwordHash/MFA secrets', async () => {
    // 1. Mock Admin session in auth lookup
    mockGetUserFromRequest.mockReturnValue({
      userId: 1,
      username: 'admin',
      role: 'admin',
      tenantId: 'n11',
    });

    // 2. Mock DB user lookup inside withRoute RBAC guard
    mockFindUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      role: 'admin',
      permissions: [],
    });

    // 3. Mock database users list returned by Prisma findMany (safe data simulation)
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        username: 'exceln52',
        fullName: 'شركة احمد اليامي - مدير النظام',
        role: 'admin',
        phone: null,
        active: true,
        createdAt: new Date(),
        branchId: 1,
        defaultPage: null,
        permissions: [
          {
            id: 1,
            tenantId: 'default',
            userId: 1,
            module: 'dashboard',
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canPrint: true,
          },
        ],
      },
    ]);

    const req = new NextRequest('https://namainvist.com/api/settings/roles');
    const res = await GET(req);

    expect(res.status).toBe(200);

    // 4. Verify that findMany was called with a select block that excludes sensitive keys
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          username: true,
          fullName: true,
          role: true,
          active: true,
        }),
      })
    );

    // Assert that the select block DOES NOT contain sensitive fields
    const findManyCallArgs = mockFindMany.mock.calls[0][0];
    expect(findManyCallArgs.select.passwordHash).toBeUndefined();
    expect(findManyCallArgs.select.totpSecretEncrypted).toBeUndefined();
    expect(findManyCallArgs.select.totpIv).toBeUndefined();
    expect(findManyCallArgs.select.totpAuthTag).toBeUndefined();
    expect(findManyCallArgs.select.sessionToken).toBeUndefined();
    expect(findManyCallArgs.select.deviceToken).toBeUndefined();

    // 5. Verify serialized response body does not leak fields
    const body = await res.json();
    expect(body[0]).toBeDefined();
    expect(body[0].passwordHash).toBeUndefined();
    expect(body[0].totpSecretEncrypted).toBeUndefined();
    expect(body[0].totpIv).toBeUndefined();
    expect(body[0].totpAuthTag).toBeUndefined();
    expect(body[0].sessionToken).toBeUndefined();
    expect(body[0].deviceToken).toBeUndefined();
  });
});
