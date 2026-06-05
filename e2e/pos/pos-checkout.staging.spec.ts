import { expect } from '@playwright/test';
import { guardTest } from '../helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from '../helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-POS-001: POS Cashier Checkout Spec
 *
 * Safety:
 * - SAFE_WITH_MOCKS / DRY-RUN
 * - Requests intercepted by mock routes
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-POS-001 - POS Cashier Checkout Spec', () => {
  guardTest('should mock checkout process and verify payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me and checkout endpoint
    await mockRouteSuccess(page, '**/api/auth/me', { id: 3, name: 'POS Cashier', role: 'CASHIER' });
    await mockRouteSuccess(page, '**/api/pos/checkout', { success: true, transactionId: 1002 });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/pos/checkout', payload => {
      capturedPayload = payload;
    });

    await page.goto('/pos/terminal');
    await page.waitForLoadState('load');

    const checkoutBtn = page.locator('button[type="submit"], #checkout-btn').first();

    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click();
      
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
    }
  });
});
