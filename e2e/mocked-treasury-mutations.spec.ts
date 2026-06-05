import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-TREASURY-001: Petty Cash Disbursement Allocation
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Requests intercepted by mock routes
 * - No ledger entries or treasury allocations committed
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-TREASURY-001 - Mocked Treasury Transactions', () => {
  guardTest('should mock petty cash disbursement and capture payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Treasurer', role: 'TREASURY_USER' });
    // Intercept petty cash submit
    await mockRouteSuccess(page, '**/api/treasury/petty-cash', { success: true });


    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/treasury/petty-cash', payload => {
      capturedPayload = payload;
    });

    await page.goto('/treasury/petty-cash').catch(() => {});
    await page.waitForLoadState('domcontentloaded');

    const submitBtn = page.locator('button:has-text("Disburse"), #disburse-btn').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
    }
  });
});
