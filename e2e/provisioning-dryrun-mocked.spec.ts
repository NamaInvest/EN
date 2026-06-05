import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-ONBOARDING-001: Provisioning of tenant / company setup dry-run
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Intercepts settings updates and licensing calls
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-ONBOARDING-001 - Tenant Onboarding & Company Setup Flow', () => {
  guardTest('should complete the entire multi-step setup successfully with mocked APIs', async ({ page }) => {
    // Authenticate user
    await authenticatePage(page.context());

    // Mock settings fetch to return template default settings
    await mockRouteSuccess(page, '**/api/settings', { company_name: '' });

    // Mock translate API
    await page.route(/\/api\/translate.*/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ translated: 'e2e-company' })
      });
    });

    // Mock desktop register to cloud
    await mockRouteSuccess(page, /.*\/api\/ice\/desktop-register/, {
      success: true,
      license_key: 'E2E-LICENSE-KEY-MOCK-2026',
      subdomain: 'e2e-company'
    });

    await page.goto('/company-setup');
    await page.waitForLoadState('load');

    // Fill Step 1
    const nameArField = page.locator('input[placeholder*="اسم المنشأة"], input[placeholder*="مؤسسة"]').first();
    await nameArField.waitFor({ state: 'visible', timeout: 5000 });
    await nameArField.fill('مؤسسة الاختبار');

    const nameEnField = page.locator('input[dir="ltr"]').first();
    await nameEnField.fill('E2E Test Company');

    // Select business domain
    await page.locator('select').nth(1).selectOption({ index: 3 });

    // Fill mobile
    await page.locator('input[type="tel"]').fill('0512345678');

    // Click Next
    const nextBtn = page.locator('button:has-text("التالي")').first();
    await nextBtn.click();

    // Fill Step 2
    // City Arabic is first, City English is second
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).waitFor({ state: 'visible', timeout: 5000 });
    await textInputs.nth(0).fill('الرياض'); // City Ar
    await textInputs.nth(1).fill('Riyadh'); // City En
    await textInputs.nth(2).fill('الملز'); // District
    await textInputs.nth(3).fill('شارع الستين'); // Street
    await textInputs.nth(4).fill('1234'); // Building No (maxlength=4)
    await textInputs.nth(5).fill('12345'); // Postal Code (maxlength=5)

    // VAT and CRN
    await page.locator('input[maxlength="15"]').fill('300000000000003');
    await page.locator('input[maxlength="10"]').fill('7000000000');

    // Click Next to Step 3
    await nextBtn.click();

    // Verify step 3 confirmation panel is visible
    const reviewTitle = page.locator(':has-text("مراجعة البيانات"), :has-text("المنشأة")').first();
    await reviewTitle.waitFor({ state: 'visible', timeout: 5000 });
    expect(await reviewTitle.count()).toBeGreaterThan(0);

    // Mock settings post success
    await mockRouteSuccess(page, '**/api/settings', { success: true });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    // Click Provision System (تفعيل النظام)
    const provisionBtn = page.locator('button:has-text("تفعيل النظام")').first();
    await provisionBtn.click();

    // Check system setup is loading/success
    await page.waitForTimeout(2000);
    const bodyText = await page.innerText('body');
    console.log('DEBUG: Onboarding Page body text after click:\n', bodyText);

    const readyText = page.locator(':has-text("نظامك جاهز"), :has-text("جاهز للعمل"), :has-text("جاري إعداد")').first();
    await readyText.waitFor({ state: 'visible', timeout: 10000 });
    expect(await readyText.count()).toBeGreaterThan(0);
  });
});
