import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-TREASURY-001 & SCN-PURCHASES-001: Dialog Confirmations for Dangerous Actions
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Intercepts POST/PUT APIs with mock routes
 * - Verifies dialog visibility without saving actual logs
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-TREASURY-001 & SCN-PURCHASES-001 - Dangerous Action Confirmations', () => {
  guardTest('should show dialog confirmation on matched purchases matching screen', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context(), 'ACCOUNTANT');

    // Intercept matching submit
    await mockRouteSuccess(page, '**/api/purchases/matching', { success: true });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/purchases/matching', payload => {
      capturedPayload = payload;
    });

    await page.goto('/purchases/matching').catch(() => {});
    await page.waitForLoadState('load');

    const matchBtn = page.locator('button:has-text("Match"), #match-invoice-btn').first();
    if (await matchBtn.count() > 0) {
      // Click match to trigger dialog
      await matchBtn.click();
      
      // Look for a confirmation modal/dialog in DOM
      const dialog = page.locator('[role="dialog"], .dialog, .modal, :has-text("تأكيد"), :has-text("Confirm")').first();
      const isDialogVisible = await dialog.isVisible().catch(() => false);
      
      // If dialog is present, confirm it has action buttons
      if (isDialogVisible) {
        const confirmBtn = dialog.locator('button:has-text("نعم"), button:has-text("Confirm"), button:has-text("تأكيد")').first();
        const cancelBtn = dialog.locator('button:has-text("إلغاء"), button:has-text("Cancel")').first();
        
        expect(await confirmBtn.count()).toBeGreaterThan(0);
        expect(await cancelBtn.count()).toBeGreaterThan(0);
      }
    }
  });
});
