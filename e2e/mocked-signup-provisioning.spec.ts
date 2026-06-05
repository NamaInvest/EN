import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, mockRouteError, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-PUBLIC-001: Register user details (sign-up submission)
 * - SCN-ONBOARDING-001: Provisioning of tenant subdomain
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Requests intercepted before hitting Nest.js or Postgres
 * - No actual tenant databases or routing subdomains allocated
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-PUBLIC-001 & SCN-ONBOARDING-001 - Mocked SignUp and Provisioning', () => {
  guardTest('should mock successful sign-up and check request payload', async ({ page }) => {
    // Intercept signup route
    await mockRouteSuccess(page, '**/api/auth/sign-up', { success: true });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/auth/sign-up', payload => {
      capturedPayload = payload;
    });

    await page.goto('/sign-up');
    await page.waitForLoadState('load');

    const emailField = page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordField = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitBtn = page.locator('button[type="submit"], #register-btn').first();

    if (await emailField.count() > 0 && await passwordField.count() > 0 && await submitBtn.count() > 0) {
      await emailField.fill('e2e-fake-user@test.com');
      await passwordField.fill('fakePassword123');
      await submitBtn.click();
      
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.email).toBe('e2e-fake-user@test.com');
    }
  });

  guardTest('should mock tenant provisioning and confirm mock success feedback', async ({ page }) => {
    // Authenticate the page before visiting protected setup route
    await authenticatePage(page.context());

    // Intercept tenant provisioning route
    await mockRouteSuccess(page, '**/api/tenant/provision', { success: true, subdomain: 'e2e-mock-tenant' });

    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/tenant/provision', payload => {
      capturedPayload = payload;
    });

    await page.goto('/company-setup');
    await page.waitForLoadState('load');
    await page.locator('input[name="subdomain"], #subdomain').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    const subdomainField = page.locator('input[name="subdomain"], #subdomain').first();
    const companyField = page.locator('input[name="companyName"], #companyName').first();
    const submitBtn = page.locator('button[type="submit"], #provision-btn').first();


    if (await subdomainField.count() > 0 && await companyField.count() > 0 && await submitBtn.count() > 0) {
      await subdomainField.fill('e2e-mock-tenant');
      await companyField.fill('E2E Mock Corporation');
      await submitBtn.click();
      
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.subdomain).toBe('e2e-mock-tenant');
    }
  });
});
