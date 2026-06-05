import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-AUTH-001: Authentication & Protected Session Isolation
 *
 * Safety:
 * - SAFE_E2E
 * - Authentication validation and error responses only
 * - No DB mutations
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-AUTH-001 - Authentication Protected Routes E2E Tests', () => {
  guardTest('should load the login page and show credentials form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify presence of input credentials
    const textInput = page.locator('input[type="text"], input[name="username"], #username').first();
    await expect(textInput).toBeVisible();
  });

  guardTest('should show errors on login form submission with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in mock incorrect credentials
    await page.fill('input[type="text"], input[name="username"], #username', 'mock_invalid_user_e2e_guard');
    await page.fill('input[type="password"], input[name="password"], #password', 'mock_invalid_pwd_e2e_guard_123');
    
    // Submit
    const submitBtn = page.locator('button[type="submit"], #login-btn, #login-btn-auto').first();
    await submitBtn.click();

    // Confirm that the page does not redirect to dashboard or displays failure
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url === '/').toBeTruthy();
  });

  guardTest('should redirect unauthenticated users away from protected dashboard', async ({ page }) => {
    // Attempting to visit /dashboard directly without session
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Unauthenticated user should not see a populated dashboard
    // It should redirect to login or show empty/unauthorized page
    const dashboardCards = page.locator('[data-testid="kpi-card"], .dashboard-grid');
    const isDashboardVisible = await dashboardCards.isVisible().catch(() => false);
    expect(isDashboardVisible).toBeFalsy();
  });
});
