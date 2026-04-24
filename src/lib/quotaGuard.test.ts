import { checkQuota, quotaErrorResponse } from './quotaGuard';

// Mock next/server to avoid Request/Response not defined errors in Jest
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));

// Mock the 'pg' module
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Quota Guard Tests', () => {
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { Pool } = require('pg');
    mockPool = new Pool();
  });

  describe('checkQuota', () => {
    it('should allow if no tenant data is found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // master DB returns nothing
      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('ok');
    });

    it('should allow unlimited invoices for paid plans', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'active', plan: 'professional' }],
      });
      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(true);
      expect(result.plan).toBe('professional');
    });

    it('should block if trial has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 1 day ago
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'trial', plan: 'free', trial_ends_at: pastDate }],
      });
      
      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('trial_expired');
    });

    it('should block if invoice quota is exceeded on free plan', async () => {
      // First query: master DB
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'active', plan: 'free', invoice_quota: 30 }],
      });
      // Second query: tenant DB
      mockPool.query.mockResolvedValueOnce({
        rows: [{ cnt: '35' }], // 35 invoices created
      });

      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('quota_exceeded');
      expect(result.current).toBe(35);
      expect(result.limit).toBe(30);
    });

    it('should allow if within quota limits', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'active', plan: 'free', product_quota: 100 }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ cnt: '50' }], // 50 products created
      });

      const result = await checkQuota('tenant1', 'product');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('ok');
      expect(result.current).toBe(50);
    });
  });

  describe('quotaErrorResponse', () => {
    it('should return a 402 response with proper format', () => {
      const result = {
        allowed: false,
        reason: 'quota_exceeded' as const,
        resource: 'invoice',
        limit: 30,
        current: 35,
        plan: 'free',
        message: 'Quota exceeded',
      };
      
      const response = quotaErrorResponse(result);
      expect(response.status).toBe(402);
    });
  });
});
