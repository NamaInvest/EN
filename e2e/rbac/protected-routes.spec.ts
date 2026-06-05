import { guardTest, expect } from '../helpers/environment-guard';

guardTest.describe('SCN-TENANTADMIN-001 - E2E Security - RBAC & Route Protection Smoke Tests', () => {
  guardTest('should redirect unauthenticated users targeting corporate finance to login page', async ({ page }) => {
    // Attempting to access protected financial ledger without session
    await page.goto('/accounting');
    await page.waitForLoadState('networkidle');
    
    // Expect redirection to login or auth page
    const currentUrl = page.url();
    expect(currentUrl.includes('login') || currentUrl.includes('sign-in') || currentUrl.includes('auth')).toBeTruthy();
  });

  guardTest('should block unauthorized guest users from administrative settings', async ({ page }) => {
    // Attempting to access advanced system configuration panel
    await page.goto('/settings/security');
    await page.waitForLoadState('networkidle');
    
    // Expect login redirect or explicit HTTP 403 Forbidden alert box
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('login') || currentUrl.includes('sign-in') || currentUrl.includes('auth');
    
    const isForbiddenMsg = await page.locator('.forbidden-message, [class*="forbidden"], .text-red, h1:has-text("403")').isVisible().catch(() => false);
    
    expect(isRedirected || isForbiddenMsg).toBeTruthy();
  });
});
