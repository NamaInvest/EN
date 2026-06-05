import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-AI-001: AI/RAG Operations Rejection Gate
 *
 * Safety:
 * - API_ONLY_SAFE (Fail-closed check)
 * - Verifies API rejects request when unauthenticated
 * - No chat calls or document ingestions executed
 * - Production target blocked by environment guard
 */
guardTest.describe('SCN-AI-001 - AI/RAG Endpoints Unauthenticated Rejection', () => {
  const aiEndpoints = [
    { url: '/api/ai/ingest', method: 'POST', data: { fileUrl: 'http://hack.com/doc.pdf' } },
    { url: '/api/ai/chat', method: 'POST', data: { prompt: 'Hello' } },
    { url: '/api/ai/rag', method: 'POST', data: { query: 'fraud patterns' } },
    { url: '/api/ai/bank-fraud', method: 'POST', data: {} }
  ];

  for (const endpoint of aiEndpoints) {
    guardTest(`should reject unauthenticated request to ${endpoint.method} ${endpoint.url}`, async ({ request }) => {
      const response = await request.post(endpoint.url, {
        data: endpoint.data
      });

      const status = response.status();
      // Should reject with auth error 401, 403, or 400
      expect(status === 401 || status === 403 || status === 400 || status >= 300 && status < 400).toBeTruthy();
    });
  }
});
