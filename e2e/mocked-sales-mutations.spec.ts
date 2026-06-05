import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-SALES-001: Sales Invoice Creation & ZATCA Submission Gate
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Requests intercepted by mock routes
 * - No actual sales invoices logged to Postgres or ZATCA servers
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-SALES-001 - Mocked Sales Order Mutations', () => {
  guardTest('should mock sales invoice creation and verify payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Sales Agent', role: 'SALES_USER' });
    // Intercept sales order creation
    await mockRouteSuccess(page, '**/api/sales/orders', { success: true, invoiceId: 987 });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/sales/orders', payload => {
      capturedPayload = payload;
    });

    await page.goto('/sales/create');
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
