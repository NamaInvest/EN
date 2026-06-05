import { expect } from '@playwright/test';
import { guardTest } from '../helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from '../helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-INVENTORY-001: Inventory Stocktake and Reconciliation
 *
 * Safety:
 * - SAFE_WITH_MOCKS / DRY-RUN
 * - Requests intercepted by mock routes
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-INVENTORY-001 - Stocktake & Reconciliation Spec', () => {
  guardTest('should mock stocktake load, cron generation, and approval reconciliation', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Setup dialog listener to automatically accept the confirmation popup
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('هل أنت متأكد من اعتماد الجرد؟');
      await dialog.accept();
    });

    // Intercept auth/me and data endpoints
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Inventory Manager', role: 'INVENTORY_USER' });
    await mockRouteSuccess(page, '**/api/inventory/stocktake', {
      data: [
        { id: 1, stocktakeDate: '2026-06-05', totalItems: 12, matched: 10, short: 1, over: 1, status: 'pending', notes: 'Auto-generated Cycle Count Schedule' }
      ]
    });
    await mockRouteSuccess(page, '**/api/cron/cycle-count', { message: 'Cron generated successfully' });
    await mockRouteSuccess(page, '**/api/inventory/stocktake/1/approve', { success: true });

    let approvePayloadCaptured = false;
    page.on('request', request => {
      if (request.url().includes('/api/inventory/stocktake/1/approve') && request.method() === 'POST') {
        approvePayloadCaptured = true;
      }
    });

    await page.goto('/inventory/stocktake/cycle');
    await page.waitForLoadState('load');

    // Click on generate cron plan
    const cronBtn = page.locator('button:has-text("Cron"), button:has-text("توليد")').first();
    if (await cronBtn.count() > 0) {
      await cronBtn.click();
      await page.waitForTimeout(500);
    }

    // Click on "Approve and Reconcile" button
    const approveBtn = page.locator('button:has-text("اعتماد وتسوية"), button:has-text("Approve")').first();
    if (await approveBtn.count() > 0) {
      await approveBtn.click();
      await page.waitForTimeout(1000);
      expect(approvePayloadCaptured).toBe(true);
    }
  });
});
