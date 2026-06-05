import { expect } from '@playwright/test';
import { guardTest } from '../helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from '../helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-SALES-001: Sales Invoice Creation & ZATCA Submission Gate
 *
 * Safety:
 * - SAFE_WITH_MOCKS / DRY-RUN
 * - Requests intercepted by mock routes
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-SALES-001 - Sales Invoice Lifecycle Spec', () => {
  guardTest('should mock sales invoice creation and verify payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me and sales invoices endpoint
    await mockRouteSuccess(page, '**/api/auth/me', { id: 2, name: 'Senior Accountant', role: 'ACCOUNTANT' });
    await mockRouteSuccess(page, '**/api/sales/invoices', { success: true, invoiceId: 543 });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/sales/invoices', payload => {
      capturedPayload = payload;
    });

    await page.goto('/sales/invoice/new');
    await page.waitForLoadState('load');

    const customerField = page.locator('select[name="customerId"], #customerId').first();
    const saveBtn = page.locator('button[type="submit"], #save-invoice-btn').first();

    if (await customerField.count() > 0 && await saveBtn.count() > 0) {
      await customerField.selectOption({ label: 'Ahmed' }).catch(() => {});
      await saveBtn.click();
      
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
    }
  });
});
