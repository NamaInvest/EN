import { withRoute, WithRouteOptions } from '@/lib/api/with-route';
import { NextRequest, NextResponse } from 'next/server';

// ── Mock Dependencies ────────────────────────────────────────────────────────

// Mock Redis to prevent real connection attempts during tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      incr: jest.fn().mockResolvedValue(1),
      pexpire: jest.fn().mockResolvedValue(true),
    };
  });
});

// Mock Next.js metrics and instrumentation
jest.mock('@/lib/instrumentation/metrics', () => ({
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
}));

// Mock logger
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
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
  getTokenFromRequest: jest.fn(),
  verifyToken: jest.fn(),
}));

// Mock Tenant isolation and Prisma helpers inside a single hoisted factory
jest.mock('@/lib/prisma', () => {
  const original = jest.requireActual('async_hooks');
  const store = new original.AsyncLocalStorage();
  
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
  };
  
  return {
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
  assertTenantContextMatch: jest.fn(),
  TENANT_ISOLATION_ERROR: 'Tenant isolation violation',
}));

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Centralized Backend RBAC (withRoute)', () => {
  let mockHandler: jest.Mock;
  let mockFindUniqueUser: jest.Mock;
  let mockGetUserFromRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandler = jest.fn().mockResolvedValue(
      new NextResponse(JSON.stringify({ success: true }), { status: 200 })
    );
    // Retrieve the mocked findUnique method dynamically
    const prisma = require('@/lib/prisma').getPrisma();
    mockFindUniqueUser = prisma.user.findUnique as jest.Mock;

    // Retrieve the mocked auth getUserFromRequest method dynamically
    const auth = require('@/lib/auth');
    mockGetUserFromRequest = auth.getUserFromRequest as jest.Mock;
  });

  const runWrappedRoute = async (
    req: NextRequest,
    options: WithRouteOptions,
    context?: any
  ) => {
    const wrapped = withRoute(mockHandler, options);
    return await wrapped(req, context);
  };

  it('should allow access if requireAuth is false', async () => {
    const req = new NextRequest('http://localhost/api/public-route');
    const res = await runWrappedRoute(req, { requireAuth: false });
    
    expect(res.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should block with 401 if user is unauthenticated', async () => {
    mockGetUserFromRequest.mockReturnValue(null); // Unauthenticated

    const req = new NextRequest('http://localhost/api/sensitive-route');
    const res = await runWrappedRoute(req, { requireAuth: true });
    
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should allow access to any authenticated user if no module option is specified', async () => {
    mockGetUserFromRequest.mockReturnValue({
      userId: 123,
      role: 'cashier',
      tenantId: 'n11',
    });

    const req = new NextRequest('http://localhost/api/basic-auth-route');
    const res = await runWrappedRoute(req, { requireAuth: true });
    
    expect(res.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should block with 403 if user lacks dynamic module permission', async () => {
    mockGetUserFromRequest.mockReturnValue({
      userId: 123,
      role: 'cashier',
      tenantId: 'n11',
    });

    // Mock DB user loaded inside the scoped context
    mockFindUniqueUser.mockResolvedValue({
      id: 123,
      role: 'cashier',
      permissions: [], // No module permissions
    });

    const req = new NextRequest('http://localhost/api/treasury/cash-position');
    const res = await runWrappedRoute(req, {
      requireAuth: true,
      module: 'treasury',
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toContain('صلاحيات غير كافية للوصول إلى هذا القسم');
  });

  it('should block with 403 if user has the module but lacks specific action permission', async () => {
    mockGetUserFromRequest.mockReturnValue({
      userId: 123,
      role: 'cashier',
      tenantId: 'n11',
    });

    mockFindUniqueUser.mockResolvedValue({
      id: 123,
      role: 'cashier',
      permissions: [
        {
          module: 'payroll',
          canView: true,
          canAdd: false, // Lacks permission to add
        },
      ],
    });

    const req = new NextRequest('http://localhost/api/payroll', { method: 'POST' });
    const res = await runWrappedRoute(req, {
      requireAuth: true,
      module: 'payroll',
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toContain('صلاحيات غير كافية لإجراء هذه العملية');
  });

  it('should allow access if user has correct module and action permissions', async () => {
    mockGetUserFromRequest.mockReturnValue({
      userId: 123,
      role: 'accountant',
      tenantId: 'n11',
    });

    mockFindUniqueUser.mockResolvedValue({
      id: 123,
      role: 'accountant',
      permissions: [
        {
          module: 'treasury',
          canView: true,
        },
      ],
    });

    const req = new NextRequest('http://localhost/api/treasury/cash-position');
    const res = await runWrappedRoute(req, {
      requireAuth: true,
      module: 'treasury',
    });

    expect(res.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should bypass module check completely if role is admin or owner', async () => {
    mockGetUserFromRequest.mockReturnValue({
      userId: 999,
      role: 'admin',
      tenantId: 'n11',
    });

    mockFindUniqueUser.mockResolvedValue({
      id: 999,
      role: 'admin',
      permissions: [], // No explicit module permissions
    });

    const req = new NextRequest('http://localhost/api/treasury/cash-position');
    const res = await runWrappedRoute(req, {
      requireAuth: true,
      module: 'treasury',
    });

    expect(res.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should enforce role-based restriction options when roles array is explicitly configured', async () => {
    mockGetUserFromRequest.mockReturnValue({
      userId: 123,
      role: 'cashier', // Not admin/owner
      tenantId: 'n11',
    });

    const req = new NextRequest('http://localhost/api/audit-logs');
    const res = await runWrappedRoute(req, {
      requireAuth: true,
      roles: ['admin', 'owner'],
    });

    expect(res.status).toBe(403);
  });
});
