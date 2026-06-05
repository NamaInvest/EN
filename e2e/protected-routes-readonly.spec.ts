import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-AUTH-001: Redirection of Guests on Protected Routes
 * - SCN-TENANTADMIN-001: Role-based protection of configurations
 *
 * Safety:
 * - SAFE_E2E
 * - Read-only redirection checks
 * - No credentials/cookies set
 * - Production target blocked by environment guard
 */
guardTest.describe('Protected Routes Redirection Tests', () => {
  const protectedPaths = [
    '/dashboard',
    '/accounting',
    '/sales',
    '/purchases',
    '/inventory',
    '/treasury',
    '/settings/roles',
    '/settings/custom-fields'
  ];

  for (const path of protectedPaths) {
    guardTest(`should block guest from accessing ${path} and redirect to login/home`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      // Should redirect to login or root home, not render dashboard elements
      expect(url.includes('login') || url === '/' || !url.includes(path)).toBeTruthy();

      const dashboardCards = page.locator('[data-testid="kpi-card"], .dashboard-grid');
      const isDashboardVisible = await dashboardCards.isVisible().catch(() => false);
      expect(isDashboardVisible).toBeFalsy();
    });
  }
});
