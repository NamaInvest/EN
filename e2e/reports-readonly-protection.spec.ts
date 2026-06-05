import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-REPORTS-001: Report Pages Read-only Protection
 *
 * Safety:
 * - SAFE_E2E
 * - Read-only page redirection checks
 * - No data generation or export execution
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-REPORTS-001 - Reports Protection and Redirection Tests', () => {
  const reportPaths = [
    '/reports',
    '/reports/cashflow',
    '/finance/balance-sheet',
    '/accounting/trial-balance',
    '/accounting/profit-loss'
  ];

  for (const path of reportPaths) {
    guardTest(`should restrict guest access to reports path: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const url = page.url();
      // Must not display report data; must redirect to login/home
      expect(url.includes('login') || url === '/' || !url.includes(path)).toBeTruthy();

      const reportTable = page.locator('.report-table, .balance-sheet-grid');
      const isReportVisible = await reportTable.isVisible().catch(() => false);
      expect(isReportVisible).toBeFalsy();
    });
  }
});
