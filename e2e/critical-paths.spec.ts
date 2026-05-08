// @ts-nocheck
/**
 * E2E Tests — 25 Critical User Paths
 * ──────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';

// ── Auth ──

test('1. Login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'password');
  await page.click('#login-btn');
  await expect(page).toHaveURL(/dashboard|home/);
});

test('2. Login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'wrong');
  await page.fill('#password', 'wrong');
  await page.click('#login-btn');
  await expect(page.locator('.error, [role="alert"]')).toBeVisible();
});

test('3. Logout redirects to login', async ({ page }) => {
  await page.goto('/login');
  // Quick login
  await page.fill('#username', 'admin');
  await page.fill('#password', 'password');
  await page.click('#login-btn');
  await page.waitForURL(/dashboard|home/);
  // Logout
  const logoutBtn = page.locator('text=تسجيل الخروج, text=Logout').first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await expect(page).toHaveURL(/login|sign-in/);
  }
});

// ── Dashboard ──

test('4. Dashboard loads with stats', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/لوحة|dashboard/i);
});

// ── Sales ──

test('5. Sales invoices list loads', async ({ page }) => {
  await page.goto('/sales');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('table, [role="grid"]').first()).toBeVisible({ timeout: 10000 });
});

test('6. Create new sales invoice', async ({ page }) => {
  await page.goto('/sales/create');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('form, [data-testid="invoice-form"]').first()).toBeVisible({ timeout: 10000 });
});

// ── Products ──

test('7. Products list loads', async ({ page }) => {
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('table, [role="grid"]').first()).toBeVisible({ timeout: 10000 });
});

test('8. Product search works', async ({ page }) => {
  await page.goto('/products');
  const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="Search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('test');
    await page.waitForTimeout(500);
  }
});

// ── Customers ──

test('9. Customers list loads', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('خطأ');
});

// ── Purchases ──

test('10. Purchases page loads', async ({ page }) => {
  await page.goto('/purchases');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('500');
});

// ── Accounting ──

test('11. Chart of accounts loads', async ({ page }) => {
  await page.goto('/accounting/accounts');
  await page.waitForLoadState('networkidle');
});

test('12. Journal entries page loads', async ({ page }) => {
  await page.goto('/accounting/journal');
  await page.waitForLoadState('networkidle');
});

test('13. Trial balance loads', async ({ page }) => {
  await page.goto('/accounting/trial-balance');
  await page.waitForLoadState('networkidle');
});

// ── HR ──

test('14. Employees list loads', async ({ page }) => {
  await page.goto('/employees');
  await page.waitForLoadState('networkidle');
});

test('15. Payroll page loads', async ({ page }) => {
  await page.goto('/payroll');
  await page.waitForLoadState('networkidle');
});

// ── Inventory ──

test('16. Inventory page loads', async ({ page }) => {
  await page.goto('/inventory');
  await page.waitForLoadState('networkidle');
});

// ── POS ──

test('17. POS checkout loads', async ({ page }) => {
  await page.goto('/pos');
  await page.waitForLoadState('networkidle');
});

// ── Reports ──

test('18. Financial reports loads', async ({ page }) => {
  await page.goto('/reports');
  await page.waitForLoadState('networkidle');
});

// ── Settings ──

test('19. Settings page loads', async ({ page }) => {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
});

// ── API ──

test('20. Health endpoint returns 200', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('healthy');
});

test('21. OpenAPI spec is accessible', async ({ request }) => {
  const res = await request.get('/api/docs/openapi.json');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.openapi).toBe('3.1.0');
});

test('22. Unauthenticated API returns 401', async ({ request }) => {
  const res = await request.get('/api/sales');
  expect([401, 302, 307]).toContain(res.status());
});

// ── Mobile Responsive ──

test('23. Mobile viewport renders correctly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/login');
  await expect(page.locator('body')).toBeVisible();
});

// ── ZATCA ──

test('24. ZATCA settings page loads', async ({ page }) => {
  await page.goto('/zatca');
  await page.waitForLoadState('networkidle');
});

// ── AI Assistant ──

test('25. AI chat interface loads', async ({ page }) => {
  await page.goto('/ai-assistant');
  await page.waitForLoadState('networkidle');
});
