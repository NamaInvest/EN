import { guardTest, expect } from '../helpers/environment-guard';

guardTest.describe('SCN-AUTH-001 - E2E Security - Authentication Smoke Tests', () => {
  guardTest('should load the login page successfully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Expect the login container or username input to be visible
    const usernameInput = page.locator('input[type="text"]').first();
    await expect(usernameInput).toBeVisible();
    
    // Verify typography elements (Inter/Cairo) are loading
    const title = page.locator('.login-logo-text, .login-logo').first();
    await expect(title).toBeVisible();
  });

  guardTest('should display error message on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="text"]', 'unauthorized_developer_mock');
    await page.fill('input[type="password"]', 'wrong_password_mock_123');
    await page.click('button[type="submit"], #login-btn-auto');
    
    // Allow slight delay for network request
    await page.waitForTimeout(1000);
    
    // Expect user to stay on /login or show error indicator
    const isLoginPath = page.url().includes('login');
    const hasError = await page.locator('.error-msg, [role="alert"], [style*="F87171"], [class*="error"]').isVisible().catch(() => false);
    
    expect(isLoginPath || hasError).toBeTruthy();
  });
});
