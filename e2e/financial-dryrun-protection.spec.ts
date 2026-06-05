import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, mockRouteError, authenticatePage } from './helpers/mock-api';


/**
 * E2E Scenario Coverage:
 * - SCN-ACCOUNTING-001: Protect accounting pages from unauthorized roles
 *
 * Safety:
 * - SAFE_E2E
 * - Read-only authorization gates checks
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-ACCOUNTING-001 - Financial Protection and Role Authorization', () => {
  guardTest('should redirect unauthenticated users to login on visiting accounting root', async ({ page }) => {
    await page.goto('/accounting');
    await page.waitForLoadState('load');

    // Should redirect to login page
    await page.waitForURL(url => url.pathname.includes('login') || url.pathname === '/login', { timeout: 5000 }).catch(() => {});
    expect(page.url()).toContain('login');
  });

  guardTest('should block user with unauthorized role from submitting a journal page', async ({ page }) => {
    // Authenticate with a non-finance role
    await authenticatePage(page.context(), 'INVENTORY_USER');

    // Intercept journal POST API to return 403 Forbidden
    await mockRouteError(page, '**/api/accounting/journal', 403, { error: 'Forbidden', message: 'Unauthorized access' });

    await page.goto('/accounting/journal/new');
    await page.waitForLoadState('load');

    const descField = page.locator('input[name="description"], textarea[name="description"], input#description').first();
    const saveBtn = page.locator('button:has-text("حفظ"), #save-journal-btn').first();

    console.log('DEBUG: URL is', page.url());
    console.log('DEBUG: descField count =', await descField.count(), 'saveBtn count =', await saveBtn.count());

    await descField.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });

    if (await descField.count() > 0 && await saveBtn.count() > 0) {
      await descField.fill('E2E Test Unauthorized Submission');

      // Wait for the first line input to be visible
      await page.locator('input[name="lines.0.accountCode"]').waitFor({ state: 'visible', timeout: 5000 });

      // Fill in account numbers to satisfy line constraints using exact registered names
      await page.locator('input[name="lines.0.accountCode"]').fill('1110');
      await page.locator('input[name="lines.1.accountCode"]').fill('2110');

      // Fill in debit and credit values to balance the entry using exact registered names
      await page.locator('input[name="lines.0.debit"]').fill('100');
      await page.locator('input[name="lines.1.credit"]').fill('100');

      page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
      page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

      await saveBtn.click();
      
      // Wait for error feedback from the mocked 403 response
      await page.waitForTimeout(2000);
      const bodyText = await page.innerText('body');
      console.log('DEBUG: Page Body text after click:\n', bodyText);

      const errorMsg = page.locator(':has-text("Unauthorized"), :has-text("Forbidden"), :has-text("خطأ"), :has-text("غير مصرح")').first();
      expect(await errorMsg.count()).toBeGreaterThan(0);
    }
  });
});


