import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { withRoute } from '../../../../src/lib/api/with-route';

// Mock getPrisma to avoid real DB connections in tests
vi.mock('../../../../src/lib/prisma', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getPrisma: vi.fn().mockReturnValue({}),
  };
});

// Mock user from request
vi.mock('../../../../src/lib/auth', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getUserFromRequest: vi.fn().mockImplementation((req) => {
      // simulate returning tenant_a if the test sets it, but actually the test is about requesting tenant_b when authenticated as tenant_a
      return { tenantId: 'tenant_a', userId: 1, role: 'user' };
    }),
  };
});

describe('Route Guards Hardening', () => {
  const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

  it('should block authenticated route if tenant context is missing and tenantRequired is true', async () => {
    process.env.DESKTOP_MODE = 'false';
    const guarded = withRoute(mockHandler, { tenantRequired: true, requireAuth: false });
    const req = new NextRequest('http://localhost/api/test', {
      method: 'GET'
    });
    
    const response = await guarded(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('TENANT_ISOLATION_VIOLATION');
  });

  it('should allow public route (tenantRequired = false, requireAuth = false) without tenantId', async () => {
    const guarded = withRoute(mockHandler, { tenantRequired: false, requireAuth: false });
    const req = new NextRequest('http://localhost/api/public', {
      method: 'GET'
    });
    
    const response = await guarded(req);
    expect(response.status).toBe(200);
  });

  it('should block cross-tenant access in authenticated routes', async () => {

    const guarded = withRoute(mockHandler, { requireAuth: true });
    
    // Request explicitly asking for tenant_b but auth is tenant_a
    const req = new NextRequest('http://localhost/api/test', {
      method: 'GET',
      headers: { 'x-tenant-id': 'tenant_b' }
    });
    
    const response = await guarded(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('TENANT_ISOLATION_VIOLATION');
  });

  it('should enforce role restrictions', async () => {
    const guarded = withRoute(mockHandler, { requireAuth: true, roles: ['admin'] });
    
    const req = new NextRequest('http://localhost/api/test', {
      method: 'GET',
      headers: { 'x-tenant-id': 'tenant_a' }
    });
    
    const response = await guarded(req);
    expect(response.status).toBe(403);
    // Since mock user is role 'user', it should forbid
  });
});
