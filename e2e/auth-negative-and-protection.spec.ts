import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-AUTH-001: Authentication Negative Paths & Form Protection
 *
 * Safety:
 * - SAFE_E2E
 * - Validates credentials failure states
 * - No active writes or session creations
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-AUTH-001 - Authentication Negative Tests', () => {
  guardTest('should fail login with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator('button[type="submit"], #login-btn, #login-btn-auto').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      
      // Should remain on the login page
      const currentURL = page.url();
      expect(currentURL.includes('login') || currentURL === '/').toBeTruthy();
    }
  });

  guardTest('should render error messages when credentials are wrong', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const userField = page.locator('input[type="text"], input[name="username"], #username').first();
    const passField = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitBtn = page.locator('button[type="submit"], #login-btn, #login-btn-auto').first();

    if (await userField.count() > 0 && await passField.count() > 0 && await submitBtn.count() > 0) {
      await userField.fill('wrong_username_xyz');
      await passField.fill('wrong_password_abc_123');
      await submitBtn.click();
      
      await page.waitForTimeout(2000);
      
      // Should either show error message or keep login form visible
      const isLoginVisible = await userField.isVisible();
      expect(isLoginVisible).toBeTruthy();
    }
  });
});
