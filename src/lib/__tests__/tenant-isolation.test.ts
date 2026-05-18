import {
  TENANT_ISOLATION_ERROR,
  assertTenantContextMatch,
  buildTenantContext,
  ensureTenantWhere,
  getRecordTenantId,
  requireTenantId,
} from '@/lib/governance/tenant-guard';
import * as canonicalGuard from '@/lib/governance/tenant-guard';
import * as legacyTenantGuard from '@/lib/tenant/tenant-guard';
import * as legacySecurityGuard from '@/lib/security/tenant-guard';

describe('Tenant Isolation Governance', () => {
  describe('canonical guard compatibility', () => {
    it('keeps legacy tenant guard exports bound to the canonical guard', () => {
      expect(legacyTenantGuard.requireTenantId).toBe(canonicalGuard.requireTenantId);
      expect(legacySecurityGuard.validateTenantAccess).toBe(canonicalGuard.validateTenantAccess);
      expect(legacySecurityGuard.requireTenantFilter).toBe(canonicalGuard.requireTenantFilter);
    });
  });

  describe('tenant slug versus row tenantId', () => {
    it('keeps legacy shared-db tenants scoped to their real tenantId', () => {
      expect(getRecordTenantId('n11', false)).toBe('n11');
      expect(getRecordTenantId('default', false)).toBe('default');
    });

    it('maps physical tenant databases to the row-level default tenantId', () => {
      expect(getRecordTenantId('company_a', false)).toBe('default');
    });

    it('injects tenantId into where clauses without changing the original object', () => {
      const original = { status: 'ACTIVE' };
      const scoped = ensureTenantWhere(original, 'n11');

      expect(scoped).toEqual({ status: 'ACTIVE', tenantId: 'n11' });
      expect(original).toEqual({ status: 'ACTIVE' });
    });
  });

  describe('request mismatch protection', () => {
    it('allows route tenant slug and tenant database name at the request boundary', () => {
      const context = buildTenantContext('company_a', 'test');

      expect(() =>
        assertTenantContextMatch({
          routeTenant: context,
          authTenantId: 'company_a_db',
          headerTenantId: 'company_a',
        })
      ).not.toThrow();
    });

    it('rejects row-level default as a request boundary tenant for physical databases', () => {
      const context = buildTenantContext('company_a', 'test');

      expect(() =>
        assertTenantContextMatch({
          routeTenant: context,
          headerTenant: 'company_a',
          headerTenantId: 'default',
        })
      ).toThrow(TENANT_ISOLATION_ERROR);
    });

    it('rejects mismatch between x-tenant and x-tenant-id', () => {
      const context = buildTenantContext('company_a', 'test');

      expect(() =>
        assertTenantContextMatch({
          routeTenant: context,
          headerTenant: 'company_a',
          headerTenantId: 'company_b',
        })
      ).toThrow(TENANT_ISOLATION_ERROR);
    });

    it('extracts tenant from canonical or compatibility headers', () => {
      const req = {
        headers: new Headers({
          'x-tenant': 'company_a',
        }),
      };

      expect(requireTenantId(req as Request)).toBe('company_a');
    });

    it('rejects routes without any tenant context instead of silently accepting blank tenant', () => {
      const req = {
        headers: new Headers(),
      };

      expect(() => requireTenantId(req as Request)).toThrow(TENANT_ISOLATION_ERROR);
    });
  });
});
