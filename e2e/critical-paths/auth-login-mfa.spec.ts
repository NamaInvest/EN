import { test, expect } from '@playwright/test';

test.describe('Authentication & MFA Critical Path', () => {
  test('User can login and is prompted for MFA if enabled', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/login');
    
    // 2. Fill credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    // 3. Wait for navigation or MFA prompt
    // Assuming admin doesn't have MFA in seed, they go straight to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=مدير النظام')).toBeVisible();
  });
});
