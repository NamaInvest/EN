import { test, expect } from '@playwright/test';

export { expect };

/**
 * Production Environment Guard for E2E Tests
 * Ensures Playwright never executes tests against real production domains.
 */
export function enforceEnvironmentGuard(baseURL: string | undefined) {
  if (!baseURL) {
    return;
  }

  const productionHosts = [
    'namainvist.com',
    'n1.namainvist.com',
    'n11.namainvist.com',
    'saas-app.namainvist.com',
    'ahmedalyamicompany.namainvist.com'
  ];

  const matched = productionHosts.some(host => baseURL.includes(host));
  if (matched) {
    throw new Error(`E2E_PRODUCTION_TARGET_BLOCKED: Hitting production URL ${baseURL} is strictly forbidden!`);
  }
}

/**
 * Custom test wrapper that automatically checks the base URL before each test.
 */
export const guardTest = test.extend<{}>({
  page: async ({ page, baseURL }, use) => {
    enforceEnvironmentGuard(baseURL);
    await use(page);
  }
});
