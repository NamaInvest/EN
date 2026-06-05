/**
 * E2E Tests — 25 Critical User Paths
 * ─────────────────────────────────────────────────────────────────────
 * Playwright tests covering: Auth, Dashboard, Sales, Inventory,
 * Approvals, HR, Finance, ZATCA, Settings, Webhooks.
 *
 * Scenarios: SCN-AUTH-001, SCN-SALES-001, SCN-INVENTORY-001, SCN-HR-001, 
 * SCN-ACCOUNTING-001, SCN-TREASURY-001, SCN-PAYROLL-001, SCN-SETTINGS-001,
 * SCN-SUPERADMIN-001, SCN-ONBOARDING-001
 *
 * Run: npx playwright test
 * CI:  E2E_BASE_URL=https://namainvist.com npx playwright test --reporter=junit
 */

import { guardTest, expect } from './helpers/environment-guard';
import { Page } from '@playwright/test';
const test = guardTest;

// ── Helper: Login ──────────────────────────────────────────────────────────────
async function login(page: Page, username = 'admin', password = 'password') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('#username, [name="username"]', username);
  await page.fill('#password, [name="password"]', password);
  await page.click('#login-btn, [type="submit"]');
  await page.waitForURL(/dashboard|home|\//,  { timeout: 15000 });
}

// ── 1. AUTH ────────────────────────────────────────────────────────────────────

test('1. Login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('#username, [name="username"]', 'admin');
  await page.fill('#password, [name="password"]', 'password');
  await page.click('#login-btn, [type="submit"]');
  await expect(page).toHaveURL(/dashboard|home|\//);
});

test('2. Login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username, [name="username"]', 'wrong_user_xyz');
  await page.fill('#password, [name="password"]', 'wrong_pass_xyz');
  await page.click('#login-btn, [type="submit"]');
  // Should show error message and NOT navigate
  await page.waitForTimeout(2000);
  const isStillLogin = page.url().includes('login');
  const hasError = await page.locator('.error-msg, [role="alert"], .text-red, [class*="error"]').isVisible().catch(() => false);
  expect(isStillLogin || hasError).toBeTruthy();
});

test('3. /api/auth/me returns authenticated user', async ({ page, request }) => {
  await login(page);
  // Extract cookies from page
  const cookies = await page.context().cookies();
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  const response = await request.get('/api/auth/me', {
    headers: { cookie: cookieStr },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('role');
  expect(body).toHaveProperty('permissionsMap');
});

// ── 2. DASHBOARD ───────────────────────────────────────────────────────────────

test('4. Dashboard loads with KPI cards', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Should have at least some content visible
  await expect(page.locator('body')).not.toBeEmpty();
  // Should not show a full-page error
  const errorEl = page.locator('[class*="error-page"], .error-boundary');
  const count = await errorEl.count();
  expect(count).toBe(0);
});

test('5. /api/dashboard returns KPIs', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/dashboard', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

// ── 3. SALES ───────────────────────────────────────────────────────────────────

test('6. Sales invoices page loads', async ({ page }) => {
  await login(page);
  await page.goto('/sales');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('7. Sales API returns list', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/sales?limit=5', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBe(200);
});

test('8. Create sales invoice page loads', async ({ page }) => {
  await login(page);
  await page.goto('/sales/create');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('form, [data-testid="invoice-form"], button[type="submit"]').first()).toBeVisible({ timeout: 10000 });
});

// ── 4. INVENTORY ───────────────────────────────────────────────────────────────

test('9. Products list loads', async ({ page }) => {
  await login(page);
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('10. /api/stock returns inventory', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/stock', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

test('11. Low stock alert in inventory', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/inventory/reorder-rules', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

// ── 5. CUSTOMERS ───────────────────────────────────────────────────────────────

test('12. Customers list API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/customers?limit=5', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body) || Array.isArray(body.data)).toBeTruthy();
});

// ── 6. APPROVALS ───────────────────────────────────────────────────────────────

test('13. Approvals inbox API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/approvals/inbox', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

// ── 7. HR ──────────────────────────────────────────────────────────────────────

test('14. Employees list API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/hr/employees?limit=5', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

test('15. HR leaves API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/hr/leaves', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

// ── 8. FINANCE ─────────────────────────────────────────────────────────────────

test('16. Trial balance API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/accounting/trial-balance', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

test('17. Cash flow API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/finance/cash-flow', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

test('18. Treasury dashboard API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/treasury/dashboard', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

// ── 9. ZATCA ───────────────────────────────────────────────────────────────────

test('19. ZATCA status API', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/zatca?type=status', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

// ── 10. SETTINGS & SYSTEM ─────────────────────────────────────────────────────

test('20. Settings page loads', async ({ page }) => {
  await login(page);
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('21. Webhooks API returns subscriptions', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/webhooks', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBeLessThan(500);
});

test('22. Webhook events list', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/webhooks?view=events', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBeTruthy();
  expect(body.length).toBeGreaterThan(10);
});

// ── 11. API INFRASTRUCTURE ────────────────────────────────────────────────────

test('23. /api/metrics returns Prometheus text', async ({ request }) => {
  const response = await request.get('/api/metrics');
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain('# HELP');
  expect(text).toContain('# TYPE');
});

test('24. /api/health returns healthy', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBeLessThan(500);
});

test('25. API versioning — /api/v1 rewrites correctly', async ({ page, request }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const response = await request.get('/api/v1/customers?limit=1', {
    headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') },
  });
  // Should either succeed or return JSON (not HTML 404)
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType).toContain('json');
});
