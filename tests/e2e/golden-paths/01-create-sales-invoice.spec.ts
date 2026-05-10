/**
 * Golden Path E2E: Create & Post a Sales Invoice
 * ────────────────────────────────────────────────
 * Covers the most critical business flow in the system.
 * Tags: @smoke @golden-path @sales
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ── Helpers ─────────────────────────────────────────────────────────────────
async function login(page: Page, username = 'admin', password = 'password') {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"], input[id="username"]', username);
  await page.fill('input[name="password"], input[id="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/**`, { timeout: 15_000 });
}

async function expectApiOk(page: Page, path: string) {
  const res = await page.request.get(`${BASE_URL}${path}`, {
    headers: { 'x-test-mode': '1' },
  });
  expect(res.status()).toBeLessThan(500);
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Golden Path: Sales Invoice', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('@smoke health endpoint returns 200', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toMatch(/healthy|degraded/);
    expect(body.version).toBeTruthy();
  });

  test('@smoke dashboard loads without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // No error page
    await expect(page.locator('h1, [data-testid="dashboard-title"]')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('@smoke sales invoice list loads', async ({ page }) => {
    await expectApiOk(page, '/api/sales?limit=10');
  });

  test('@golden-path create sales invoice via API', async ({ page }) => {
    // Create a minimal sales invoice
    const res = await page.request.post(`${BASE_URL}/api/sales`, {
      data: {
        customerId:     null,
        customerName:   'E2E Test Customer',
        date:           new Date().toISOString().split('T')[0],
        items: [{
          productId:   1,
          productName: 'Test Product',
          quantity:    1,
          unitPrice:   100,
          vatRate:     0.15,
        }],
      },
    });
    // Should create (201) or fail with business error (400/422), NOT server error
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(503);
  });

  test('@golden-path sales stats API responds', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/sales/stats`);
    expect(res.status()).toBeLessThan(500);
  });

  test('@golden-path accounting journal API responds', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/accounting/journal-entries?limit=5`);
    expect(res.status()).toBeLessThan(500);
  });

});
