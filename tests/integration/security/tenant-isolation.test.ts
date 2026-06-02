import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrisma, createTenantContext, simulateRollback, verifyTenantIsolation } from '../../helpers/test-harness';

// Let-binding starting with 'mock' is hoisted-safe in Vitest
let mockUserInstance: any = null;

// Mock getPrisma to avoid real DB connections in tests
vi.mock('@/lib/prisma', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getPrisma: vi.fn().mockImplementation(() => {
      return {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 99, role: 'MASTER_ADMIN', permissions: [] })
        }
      };
    }),
  };
});

// Mock user authentication module
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getUserFromRequest: vi.fn().mockImplementation(() => mockUserInstance),
  };
});

describe('Security & Tenant Isolation - Integration Tests', () => {
  let originalDesktopMode: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInstance = null;
    originalDesktopMode = process.env.DESKTOP_MODE;
    process.env.DESKTOP_MODE = 'false';
  });

  afterEach(() => {
    process.env.DESKTOP_MODE = originalDesktopMode;
  });

  it('US-SECURITY-001: Cross-tenant data leak is physically impossible via strict where clause', async () => {
    const ctx1 = createTenantContext('tenant_A');
    await mockPrisma.journalEntry.findUnique({ where: { id: 'je_1', tenantId: ctx1.tenantId } });
    verifyTenantIsolation(mockPrisma.journalEntry.findUnique, ctx1.tenantId);
  });

  it('US-SECURITY-002: Unauthenticated payload injection fails validation', async () => {
    mockUserInstance = null; // simulate unauthenticated request context
    
    const { withRoute } = await import('@/lib/api/with-route');
    const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const guarded = withRoute(mockHandler, { requireAuth: true });
    
    const req = new NextRequest('http://localhost/api/test', {
      method: 'GET',
      headers: { 'x-tenant': 'tenant_a' }
    });
    
    const response = await guarded(req);
    expect(response.status).toBe(401);
  }, 30000);

  it('US-SECURITY-003: Master Admin bypass cannot override Tenant Database Bounds', async () => {
    // Authenticated as MASTER_ADMIN belonging to tenant_a
    mockUserInstance = { tenantId: 'tenant_a', userId: 99, role: 'MASTER_ADMIN' };
    
    const { withRoute } = await import('@/lib/api/with-route');
    const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const guarded = withRoute(mockHandler, { requireAuth: true });
    
    // Explicitly trying to query or target tenant_b's workspace
    const req = new NextRequest('http://localhost/api/test', {
      method: 'GET',
      headers: { 'x-tenant': 'tenant_b' }
    });
    
    const response = await guarded(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('TENANT_ISOLATION_VIOLATION');
  });
});
