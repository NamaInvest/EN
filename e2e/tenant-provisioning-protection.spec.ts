import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-ONBOARDING-001: Tenant Provisioning Gate
 *
 * Safety:
 * - API_ONLY_SAFE (Fail-closed check)
 * - Verifies API rejects request when unauthenticated
 * - No actual tenant creation or database allocation
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-ONBOARDING-001 - Tenant Provisioning Rejection Gate', () => {
  guardTest('should reject tenant provisioning POST requests without credentials', async ({ request }) => {
    const response = await request.post('/api/tenant/provision', {
      data: {
        subdomain: 'illegal-tenant-e2e-attempt',
        companyName: 'Attempt Corp',
        adminEmail: 'attacker@hack.com'
      }
    });

    const status = response.status();
    // Must reject as unauthorized, forbidden, or bad request
    expect(status === 401 || status === 403 || status === 400 || status >= 300 && status < 400).toBeTruthy();
  });
});
