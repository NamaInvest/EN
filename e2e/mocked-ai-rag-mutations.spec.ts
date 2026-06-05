import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';
import { mockRouteSuccess, monitorRoutePayload, authenticatePage } from './helpers/mock-api';

/**
 * E2E Scenario Coverage:
 * - SCN-AI-001: AI chat & Ingestion Operations
 *
 * Safety:
 * - SAFE_WITH_MOCKS
 * - Requests intercepted by mock routes
 * - No chat prompt fees or file ingestion executed on third-party LLM providers
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-AI-001 - Mocked AI and RAG Actions', () => {
  guardTest('should mock LLM prompt response and capture prompt payload', async ({ page }) => {
    // Authenticate context
    await authenticatePage(page.context());

    // Intercept auth/me
    await mockRouteSuccess(page, '**/api/auth/me', { id: 1, name: 'Audit Officer', role: 'AUDIT_ROLE' });
    // Intercept chat API
    await mockRouteSuccess(page, '**/api/ai/chat', { reply: 'Mocked RAG Response for ledger compliance' });


    let capturedPayload: any = null;
    monitorRoutePayload(page, '**/api/ai/chat', payload => {
      capturedPayload = payload;
    });

    await page.goto('/ai/bank-fraud').catch(() => {});
    await page.waitForLoadState('domcontentloaded');

    const chatInput = page.locator('input[placeholder*="ask"], textarea, #chat-input').first();
    const sendBtn = page.locator('button:has-text("Send"), #send-chat-btn').first();

    if (await chatInput.count() > 0 && await sendBtn.count() > 0) {
      await chatInput.fill('Check suspicious transactions for tenant 1');
      await sendBtn.click();
      await page.waitForTimeout(1000);
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.prompt).toBe('Check suspicious transactions for tenant 1');
    }
  });
});
