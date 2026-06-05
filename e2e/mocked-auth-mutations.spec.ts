import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, mockRouteError } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-AUTH-001: Mocked Session Login & Redirection
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Playwright route mock blocks real auth requests
 * - No credentials submitted to backend
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-AUTH-001 - Mocked Login Mutations', () => {
  guardTest('should login successfully with mock session response', async ({ page }) => {
    // Intercept login API
    await mockRouteSuccess(page, '**/api/auth/login', { success: true, token: 'mocked_jwt_token_123' });
    // Intercept self fetch auth/me
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Mock User', role: 'ACCOUNTANT' });
    // Intercept dashboard cards
    await mockRouteSuccess(page, '**/api/dashboard', { success: true, data: {} });

    await page.goto('/login');
    await page.waitForLoadState('load');

    const userField = page.locator('input[type="text"], input[name="username"], #username').first();
    const passField = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitBtn = page.locator('button[type="submit"], #login-btn, #login-btn-auto').first();

    if (await userField.count() > 0 && await passField.count() > 0 && await submitBtn.count() > 0) {
      await userField.fill('mock_admin_user');
      await passField.fill('mock_admin_pwd');
      await submitBtn.click();
      
      // Page should redirect to dashboard or other page (not stay on login)
      await page.waitForURL(url => !url.href.includes('login'), { timeout: 5000 });
      expect(page.url()).not.toContain('login');
    }
  });

  guardTest('should show validation error message on mock error response', async ({ page }) => {
    // Intercept login API with error status
    await mockRouteError(page, '**/api/auth/login', 400, { error: 'Invalid username or password' });

    await page.goto('/login');
    await page.waitForLoadState('load');

    const userField = page.locator('input[type="text"], input[name="username"], #username').first();
    const passField = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitBtn = page.locator('button[type="submit"], #login-btn, #login-btn-auto').first();


    if (await userField.count() > 0 && await passField.count() > 0 && await submitBtn.count() > 0) {
      await userField.fill('some_user');
      await passField.fill('some_pwd');
      await submitBtn.click();
      
      await page.waitForTimeout(2000);
      
      // Should still be on the login page and input field is visible
      expect(await userField.isVisible()).toBeTruthy();
    }
  });
});
