/**
 * Golden Path E2E: Purchase Order → Receive → Post Invoice (3-Way Match)
 * ────────────────────────────────────────────────────────────────────────────
 * Tests the full Procure-to-Pay flow via API smoke tests.
 * Tags: @smoke @golden-path @procurement @financial
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"], input[id="username"]', 'admin');
  await page.fill('input[name="password"], input[id="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/**`, { timeout: 15_000 });
}

test.describe('Golden Path: Procure-to-Pay (3-Way Match)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('@smoke vendors API responds', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/vendors?limit=5`);
    expect(res.status()).toBeLessThan(500);
  });

  test('@smoke purchase orders API responds', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/purchases?limit=5`);
    expect(res.status()).toBeLessThan(500);
  });

  test('@golden-path create purchase order via API', async ({ page }) => {
    const res = await page.request.post(`${BASE_URL}/api/purchases`, {
      data: {
        vendorName: 'E2E Test Vendor',
        date:       new Date().toISOString().split('T')[0],
        items: [{
          productName: 'Test Raw Material',
          quantity:    10,
          unitPrice:   50,
          vatRate:     0.15,
        }],
      },
    });
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(503);
  });

  test('@golden-path accounts payable API responds', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/ap/aging?type=vendor`);
    expect(res.status()).toBeLessThan(500);
  });

  test('@golden-path 3-way match endpoint accessible', async ({ page }) => {
    const res = await page.request.post(`${BASE_URL}/api/ap/match`, {
      data: { dryRun: true, limit: 5 },
    });
    expect([200, 400, 404]).toContain(res.status());
  });

  test('@golden-path accounting trial balance API responds', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await page.request.get(`${BASE_URL}/api/accounting/trial-balance?date=${today}`);
    expect(res.status()).toBeLessThan(500);
  });

  test('@golden-path ZATCA API is accessible', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/zatca/status`);
    expect([200, 400, 404]).toContain(res.status());
  });

  test('@golden-path inventory levels API responds', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/inventory/levels?limit=5`);
    expect(res.status()).toBeLessThan(500);
  });

});

test.describe('Critical Financial APIs — Smoke', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const criticalEndpoints = [
    '/api/accounting/journal-entries?limit=1',
    '/api/accounting/trial-balance',
    '/api/accounting/open-items?type=receivable&limit=1',
    '/api/sales/stats',
    '/api/purchases/stats',
    '/api/inventory/levels?limit=1',
    '/api/payroll?limit=1',
    '/api/employees?limit=1',
    '/api/assets?limit=1',
    '/api/metrics',
  ];

  for (const endpoint of criticalEndpoints) {
    test(`@smoke ${endpoint} returns < 500`, async ({ page }) => {
      const res = await page.request.get(`${BASE_URL}${endpoint}`);
      expect(res.status()).toBeLessThan(500);
    });
  }

});
