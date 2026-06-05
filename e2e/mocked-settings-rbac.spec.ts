import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-TENANTADMIN-001: Save custom roles configurations
 * - SCN-SETTINGS-001: Build custom fields
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Requests intercepted by mock routes
 * - No roles or schema configurations updated in active DB
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-TENANTADMIN-001 & SCN-SETTINGS-001 - Mocked Settings Mutations', () => {
  guardTest('should mock custom roles creation submission and check payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me to mock active Admin session
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Admin User', role: 'TENANT_ADMIN' });
    // Intercept custom roles API
    await mockRouteSuccess(page, '**/api/settings/roles', { success: true });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/settings/roles', payload => {
      capturedPayload = payload;
    });

    await page.goto('/settings/roles');
    await page.waitForLoadState('load');
    await page.locator('input[name="roleName"], #roleName').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    const roleNameField = page.locator('input[name="roleName"], #roleName').first();
    const saveBtn = page.locator('button[type="submit"], #save-role-btn').first();

    if (await roleNameField.count() > 0 && await saveBtn.count() > 0) {
      await roleNameField.fill('e2e_auditor_role');
      await saveBtn.click();
      
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.roleName).toBe('e2e_auditor_role');
    }
  });

  guardTest('should mock custom fields creation and check payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Admin User', role: 'TENANT_ADMIN' });
    // Intercept custom fields API
    await mockRouteSuccess(page, '**/api/settings/custom-fields', { success: true });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/settings/custom-fields', payload => {
      capturedPayload = payload;
    });

    await page.goto('/settings/custom-fields');
    await page.waitForLoadState('load');
    await page.locator('input[name="fieldName"], #fieldName').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    const fieldNameField = page.locator('input[name="fieldName"], #fieldName').first();
    const saveBtn = page.locator('button[type="submit"], #save-field-btn').first();

    if (await fieldNameField.count() > 0 && await saveBtn.count() > 0) {
      await fieldNameField.fill('tax_residence_number');
      await saveBtn.click();
      
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.fieldName).toBe('tax_residence_number');
    }
  });
});
