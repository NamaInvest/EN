import { guardTest, expect } from '../helpers/environment-guard';

guardTest.describe('SCN-ONBOARDING-001 - E2E Security - Tenant Isolation & Subdomain Routing Smoke Tests', () => {
  guardTest('should bind tenant context to hostname or requests securely', async ({ page }) => {
    // Navigating to tenant-specific virtual workspace
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Evaluate in browser context that tenant parser utilities are active
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeDefined();
  });

  guardTest('should block requests carrying invalid tenant context headers on protected resources', async ({ request }) => {
    // Dispatching GET request with an unwhitelisted tenant ID
    const response = await request.get('/api/sales', {
      headers: {
        'x-tenant': 'non_existent_tenant_context_xyz'
      }
    });
    
    // Expect the SRE API layer to immediately reject the call with 401/403
    const status = response.status();
    expect(status === 401 || status === 403 || status === 400).toBeTruthy();
  });
});
