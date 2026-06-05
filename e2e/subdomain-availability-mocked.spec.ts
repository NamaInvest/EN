import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-ONBOARDING-001: Subdomain preview generation based on translation slug
 *
 * Safety:
 * - SAFE_E2E (Read-only UI checking)
 * - Intercepts translate API
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-ONBOARDING-001 - Subdomain Auto-slug Generation', () => {
  guardTest('should translate Arabic company name and auto-generate slug preview', async ({ page }) => {
    // Authenticate user
    await authenticatePage(page.context());

    // Mock settings fetch to return template default settings
    await mockRouteSuccess(page, '**/api/settings', { company_name: '' });

    // Mock translate API to return translated english slug
    await page.route(/\/api\/translate.*/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ translated: 'Nama Trading' })
      });
    });

    await page.goto('/company-setup');
    await page.waitForLoadState('load');

    const nameArField = page.locator('input[placeholder*="اسم المنشأة"], input[placeholder*="مؤسسة"]').first();
    await nameArField.waitFor({ state: 'visible', timeout: 5000 });

    // Fill Arabic company name
    await nameArField.fill('مؤسسة نما التجارية');

    // Wait for the translation timer (600ms debounce + translation request)
    await page.waitForTimeout(1500);

    // Verify preview subdomain updates to slugified translated English
    const subdomainPreview = page.locator(':has-text("namatrading")').first();
    await subdomainPreview.waitFor({ state: 'visible', timeout: 5000 });
    expect(await subdomainPreview.count()).toBeGreaterThan(0);
  });
});
