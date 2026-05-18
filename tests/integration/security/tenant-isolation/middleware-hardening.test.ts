import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requireTenantContext, assertTenantAccess, TENANT_ISOLATION_ERROR } from '../../../../src/lib/governance/tenant-guard';

describe('Tenant Middleware Hardening', () => {
  it('requireTenantContext should extract context from valid request', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-tenant-id': 'tenant_a' },
    });
    
    const context = requireTenantContext(req);
    expect(context.tenantSlug).toBe('tenant_a');
    expect(context.source).toBe('requireTenantContext');
  });

  it('requireTenantContext should throw if missing tenant', () => {
    const req = new NextRequest('http://localhost/api/test');
    expect(() => requireTenantContext(req)).toThrow(TENANT_ISOLATION_ERROR);
  });

  it('assertTenantAccess should allow access when requiredTenantId matches', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-tenant-id': 'tenant_b' },
    });
    
    const context = assertTenantAccess(req, 'tenant_b');
    expect(context.tenantSlug).toBe('tenant_b');
  });

  it('assertTenantAccess should block cross-tenant access', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-tenant-id': 'tenant_b' },
    });
    
    expect(() => assertTenantAccess(req, 'tenant_a')).toThrow(/Cross-tenant access denied/);
  });
  
  it('assertTenantAccess should allow access if no requiredTenantId is specified', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-tenant-id': 'tenant_c' },
      });
      
      const context = assertTenantAccess(req);
      expect(context.tenantSlug).toBe('tenant_c');
  });
});
