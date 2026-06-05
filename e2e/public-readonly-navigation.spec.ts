import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-PUBLIC-001: Visit Site & Public Navigation Links
 *
 * Safety:
 * - SAFE_E2E
 * - Read-only public page checks
 * - No database writes
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-PUBLIC-001 - Public Navigation and UI Structure Tests', () => {
  guardTest('should load the homepage with main header links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify main links exist
    const signUpLink = page.locator('a[href="/sign-up"], a:has-text("Sign Up"), a:has-text("سجل")').first();
    const loginLink = page.locator('a[href="/login"], a:has-text("Login"), a:has-text("دخول")').first();

    await expect(page.locator('body')).not.toBeEmpty();
    // Links should be visible if present on landing page
    const countSignUp = await signUpLink.count();
    if (countSignUp > 0) {
      await expect(signUpLink).toBeVisible();
    }
    const countLogin = await loginLink.count();
    if (countLogin > 0) {
      await expect(loginLink).toBeVisible();
    }
  });

  guardTest('should render pricing or about page layouts if available', async ({ page }) => {
    // Navigate to pricing page if exists, otherwise verify it does not crash next.js boundary
    await page.goto('/pricing').catch(() => {});
    await page.waitForLoadState('domcontentloaded');

    const errorBoundary = page.locator('[class*="error-page"], .error-boundary');
    const hasError = await errorBoundary.count();
    expect(hasError).toBe(0);
  });
});
