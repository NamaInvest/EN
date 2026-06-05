import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-ONBOARDING-001: Validate onboarding client-side validation errors
 *
 * Safety:
 * - SAFE_E2E (Read-only on form validation)
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-ONBOARDING-001 - Onboarding Step Validation Errors', () => {
  guardTest('should display validation errors for empty fields and invalid formats', async ({ page }) => {
    // Authenticate user
    await authenticatePage(page.context());

    // Mock settings fetch to return template default settings
    await mockRouteSuccess(page, '**/api/settings', { company_name: '' });

    await page.goto('/company-setup');
    await page.waitForLoadState('load');

    const nextBtn = page.locator('button:has-text("التالي")').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });

    // Click Next with empty fields in Step 1
    await nextBtn.click();

    // Verify step 1 validation error is displayed
    const errorAlert = page.locator('.bg-red-500\\/20, :has-text("مطلوب"), :has-text("اسم المنشأة بالعربية")').first();
    await errorAlert.waitFor({ state: 'visible', timeout: 5000 });
    expect(await errorAlert.innerText()).toContain('مطلوب');

    // Fill valid Step 1 values but invalid phone number
    const nameArField = page.locator('input[placeholder*="اسم المنشأة"], input[placeholder*="مؤسسة"]').first();
    await nameArField.fill('مؤسسة الاختبار للتحقق');
    await page.locator('select').nth(1).selectOption({ index: 3 });
    
    const phoneField = page.locator('input[type="tel"]').first();
    await phoneField.fill('123'); // Invalid phone
    await nextBtn.click();

    // Verify phone validation error
    await errorAlert.waitFor({ state: 'visible', timeout: 5000 });
    expect(await errorAlert.innerText()).toContain('الهاتف');

    // Correct phone and go to Step 2
    await phoneField.fill('0512345678');
    await nextBtn.click();

    // Wait for step 2 inputs to load (e.g. street input)
    const streetLabel = page.locator(':has-text("الشارع")').first();
    await streetLabel.waitFor({ state: 'visible', timeout: 5000 });

    // Click Next with empty Step 2 fields
    await nextBtn.click();

    // Verify city validation error
    await errorAlert.waitFor({ state: 'visible', timeout: 5000 });
    expect(await errorAlert.innerText()).toContain('المدينة');

    // Fill city, then test VAT validation
    const cityField = page.locator('input').nth(2); // City Ar
    await cityField.fill('الدمام');
    await page.locator('input[maxLength="15"]').fill('123'); // Invalid VAT
    await nextBtn.click();

    // Verify VAT validation error
    await errorAlert.waitFor({ state: 'visible', timeout: 5000 });
    expect(await errorAlert.innerText()).toContain('الضريبي');
  });
});
