import { Page, Request, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

/**
 * Reusable E2E API Mocks and Interceptors
 * This helper intercepts backend calls to completely prevent database writes on local or staging target.
 */

export async function mockRouteSuccess(page: Page, urlPattern: string | RegExp, responseBody: object = { success: true }) {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody)
    });
  });
}

export async function mockRouteError(page: Page, urlPattern: string | RegExp, status = 400, responseBody: object = { error: 'Validation failed' }) {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseBody)
    });
  });
}

/**
 * Captures request payloads to verify correct schemas are sent from UI
 */
export function monitorRoutePayload(page: Page, urlPattern: string | RegExp, callback: (payload: any) => void) {
  page.on('request', request => {
    if (typeof urlPattern === 'string' ? request.url().includes(urlPattern) : urlPattern.test(request.url())) {
      const method = request.method();
      if (method === 'POST' || method === 'PUT') {
        const postData = request.postData();
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            callback(parsed);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  });
}

/**
 * Reads JWT_SECRET dynamically from .env to sign E2E auth tokens
 */
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^JWT_SECRET=(.*)$/m);
      if (match && match[1]) {
        // Strip optional quotes
        return match[1].replace(/['"]/g, '').trim();
      }
    }
  } catch (e) {
    // Ignore error
  }
  return 'fallback_secret_key_2026';
}

/**
 * Automatically bypasses the Next.js auth guard by signing and setting a cookie token
 */
export async function authenticatePage(context: BrowserContext, role = 'admin') {
  const secret = getJwtSecret();
  const token = jwt.sign(
    { userId: 1, role, tenantId: 'default', username: 'admin_e2e_user' },
    secret,
    { expiresIn: '7d' }
  );

  await context.addCookies([
    {
      name: 'token',
      value: token,
      domain: '127.0.0.1',
      path: '/',
    }
  ]);
}

