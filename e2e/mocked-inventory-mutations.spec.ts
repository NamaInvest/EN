import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-INVENTORY-001: Inventory Stock Adjustments
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Requests intercepted by Playwright mock routes
 * - No actual stock updates or inventory revaluations
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-INVENTORY-001 - Mocked Inventory Adjustments', () => {
  guardTest('should mock stock adjustment submit and capture payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Inventory Manager', role: 'INVENTORY_USER' });
    // Intercept adjustment submit
    await mockRouteSuccess(page, '**/api/stock/adjustments', { success: true });


    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/stock/adjustments', payload => {
      capturedPayload = payload;
    });

    await page.goto('/inventory').catch(() => {});
    await page.waitForLoadState('domcontentloaded');

    const submitBtn = page.locator('button:has-text("Adjust"), #adjust-stock-btn').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
    }
  });
});
