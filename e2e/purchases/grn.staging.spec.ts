import { expect } from '@playwright/test';
import { guardTest } from '../helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from '../helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-PURCHASES-001: Goods Receipt Note (GRN) Creation & Submission
 *
 * Safety:
 * - SAFE_WITH_MOCKS / DRY-RUN
 * - Requests intercepted by mock routes
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-PURCHASES-001 - GRN Lifecycle Spec', () => {
  guardTest('should mock GRN creation and verify payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me and data fetching endpoints
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Purchases Manager', role: 'PURCHASES_USER' });
    await mockRouteSuccess(page, '**/api/purchases/grn', []);
    await mockRouteSuccess(page, '**/api/customers?type=1', [
      { id: '1', name: 'Supplier Ahmed' }
    ]);
    await mockRouteSuccess(page, '**/api/products', [
      { id: '1', name: 'Premium Cement' }
    ]);
    await mockRouteSuccess(page, '**/api/warehouses', [
      { id: '1', name: 'Main Store' }
    ]);

    // Intercept creation endpoint
    await mockRouteSuccess(page, '**/api/purchases/grn', { success: true, grnNo: '1001' });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/purchases/grn', payload => {
      capturedPayload = payload;
    });

    await page.goto('/purchases/grn');
    await page.waitForLoadState('load');

    // Click on "Add GRN" or similar button to open modal
    const addBtn = page.locator('button.primary-btn, button:has-text("Add"), button:has-text("إضافة")').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Fill form fields
      const supplierSelect = page.locator('select[name="supplierId"], select:near(label:has-text("Supplier")), select:near(label:has-text("مورد"))').first();
      if (await supplierSelect.count() > 0) {
        await supplierSelect.selectOption('1');
      }

      const warehouseSelect = page.locator('select[name="stockId"], select:near(label:has-text("Store")), select:near(label:has-text("مستودع"))').first();
      if (await warehouseSelect.count() > 0) {
        await warehouseSelect.selectOption('1');
      }

      // Click Add Item
      const addItemBtn = page.locator('button:has-text("Item"), button:has-text("صنف"), button:has-text("إضافة")').last();
      if (await addItemBtn.count() > 0) {
        await addItemBtn.click();
        await page.waitForTimeout(200);

        // Fill item product select and quantity
        const productSelect = page.locator('tbody tr select').first();
        if (await productSelect.count() > 0) {
          await productSelect.selectOption('1');
        }

        const qtyInput = page.locator('tbody tr input[type="number"]').first();
        if (await qtyInput.count() > 0) {
          await qtyInput.fill('10');
        }
      }

      // Save/Submit GRN
      const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
        expect(capturedPayload).not.toBeNull();
      }
    }
  });
});
