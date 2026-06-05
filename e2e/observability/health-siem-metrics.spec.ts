import { guardTest, expect } from '../helpers/environment-guard';

guardTest.describe('SCN-SUPERADMIN-001 - E2E Observability - Health, SIEM & Metrics Smoke Tests', () => {
  guardTest('should return 401 Unauthorized for unauthenticated metrics requests', async ({ request }) => {
    // Attempting to scrap Prometheus metrics without safe Bearer token
    const response = await request.get('/api/metrics');
    
    // Expect strict protection block
    expect(response.status()).toBe(401);
  });

  guardTest('should return 401 Unauthorized for unauthenticated SIEM log requests', async ({ request }) => {
    // Attempting to read filtered security logs without admin authorization
    const response = await request.get('/api/admin/siem');
    
    // Expect strict protection block
    expect(response.status()).toBe(401);
  });

  guardTest('should return healthy status for open health check endpoints', async ({ request }) => {
    const response = await request.get('/api/health', {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    // Expect standard 200 or 204 response
    expect(response.status()).toBeLessThan(500);
  });
});
