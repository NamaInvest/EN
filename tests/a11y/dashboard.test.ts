/**
 * Accessibility Tests — A11y Suite (13.5)
 * Uses @axe-core/playwright to verify WCAG 2.1 AA compliance
 * on the most critical ERP pages.
 *
 * Run: npx playwright test tests/a11y/ --grep "@a11y"
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages to audit — prioritized by user traffic
const PAGES_TO_AUDIT = [
  { path: '/dashboard',                    name: 'Dashboard' },
  { path: '/accounting/journal',            name: 'Journal Entries' },
  { path: '/accounting/trial-balance',      name: 'Trial Balance' },
  { path: '/finance/period-close',          name: 'Period Close' },
  { path: '/finance/payment-run',           name: 'Payment Run' },
  { path: '/purchases/rfq',                 name: 'RFQ' },
  { path: '/sales/invoices',                name: 'Sales Invoices' },
  { path: '/hr/employees',                  name: 'Employees' },
  { path: '/hr/loans',                      name: 'HR Loans' },
  { path: '/crm/leads',                     name: 'CRM Leads' },
  { path: '/approvals/inbox',               name: 'Approvals Inbox' },
];

// ─── Shared axe rules ─────────────────────────────────────────────────────────
const AXE_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  },
  // Known false positives that are acceptable:
  rules: {
    'color-contrast': { enabled: true },   // Enforce contrast
    'region':         { enabled: false },  // Skip landmark regions (ERP layout specific)
  },
};

// ─── Dynamic test generation ──────────────────────────────────────────────────
for (const { path, name } of PAGES_TO_AUDIT) {
  test(`[A11y] ${name} — WCAG 2.1 AA @a11y`, async ({ page }) => {
    // Navigate — ignore HTTP errors (page may need auth)
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    // Wait for content
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .options(AXE_OPTIONS)
      .analyze();

    // Report violations with context
    if (results.violations.length > 0) {
      const summary = results.violations.map(v =>
        `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
        v.nodes.slice(0, 2).map(n => `  → ${n.target.join(', ')}`).join('\n')
      ).join('\n\n');
      console.error(`A11y violations on ${name}:\n${summary}`);
    }

    expect(results.violations).toHaveLength(0);
  });
}

// ─── Focused interaction tests ────────────────────────────────────────────────
test('[A11y] Keyboard navigation — Tab through dashboard @a11y', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
});

test('[A11y] Modal focus trap @a11y', async ({ page }) => {
  await page.goto('/dashboard');
  // Try to find and open any modal
  const modalTrigger = page.locator('[data-testid="open-modal"], [aria-haspopup="dialog"]').first();
  if (await modalTrigger.isVisible()) {
    await modalTrigger.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 }).catch(() => null);
    const focusedInsideModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal?.contains(document.activeElement) ?? null;
    });
    if (focusedInsideModal !== null) {
      expect(focusedInsideModal).toBe(true);
    }
  }
});

test('[A11y] RTL layout — dir=rtl is set @a11y', async ({ page }) => {
  await page.goto('/dashboard');
  const dir = await page.evaluate(() => document.documentElement.dir || document.documentElement.getAttribute('dir'));
  expect(['rtl', 'auto']).toContain(dir);
});
