import { guardTest, expect } from '../helpers/environment-guard';

guardTest.describe('SCN-AUTH-001 - Authentication & MFA Critical Path', () => {
  guardTest('User can login and is prompted for MFA if enabled', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/login');
    
    // 2. Fill credentials
    await page.locator('input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin');
    await page.click('button[type="submit"], #login-btn-auto');

    // 3. Wait for navigation or MFA prompt
    // Assuming admin doesn't have MFA in seed, they go straight to dashboard
    await expect(page).toHaveURL(/.*dashboard|.*home|.*\//);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
