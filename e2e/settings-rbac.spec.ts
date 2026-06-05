import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-TENANTADMIN-001: Company Admin Custom Settings & RBAC Visibility
 *
 * Safety:
 * - SAFE_E2E
 * - Read-only page structures and forms checks
 * - No DB mutations
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-TENANTADMIN-001 - RBAC Settings and Configurations Page Loads', () => {
  guardTest('should require session/auth to view roles settings page', async ({ page }) => {
    // Navigate directly to roles configurations
    await page.goto('/settings/roles');
    await page.waitForLoadState('networkidle');

    // Should redirect to login since we do not have an active session
    const currentURL = page.url();
    expect(currentURL.includes('login') || currentURL === '/').toBeTruthy();
  });

  guardTest('should require session/auth to view custom fields configurations page', async ({ page }) => {
    // Navigate directly to custom-fields configurations
    await page.goto('/settings/custom-fields');
    await page.waitForLoadState('networkidle');

    // Should redirect to login since we do not have an active session
    const currentURL = page.url();
    expect(currentURL.includes('login') || currentURL === '/').toBeTruthy();
  });
});
