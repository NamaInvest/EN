import { checkQuota, quotaErrorResponse } from './quotaGuard';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));

// Mock the 'pg' module
jest.mock('pg', () => {
  const mPool = { query: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPool() {
  const { Pool } = require('pg');
  return new Pool();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Quota Guard Tests', () => {
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = getPool();
  });

  describe('checkQuota', () => {
    it('should allow if no tenant data is found (pass-through)', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('ok');
    });

    it('should allow unlimited for paid plans (professional)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'active', plan: 'professional' }],
      });
      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(true);
      expect(result.plan).toBe('professional');
    });

    it('should block if trial has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'trial', plan: 'free', trial_ends_at: pastDate }],
      });
      const result = await checkQuota('tenant1', 'invoice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('trial_expired');
    });

    it('should block if invoice quota exceeded on free plan', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ subscription_status: 'active', plan: 'free', invoice_quota: 30 }],
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ cnt: '35' }] });
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
      mockPool.query.mockResolvedValueOnce({ rows: [{ cnt: '50' }] });
      const result = await checkQuota('tenant1', 'product');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('ok');
      // result.current is only populated when quota is exceeded
    });
  });

  describe('quotaErrorResponse', () => {
    it('should return a 402 response with proper format', () => {
      const quotaResult = {
        allowed:  false,
        reason:   'quota_exceeded' as const,
        resource: 'invoice',
        limit:    30,
        current:  35,
        plan:     'free',
        message:  'Quota exceeded',
      };
      const response = quotaErrorResponse(quotaResult);
      expect(response.status).toBe(402);
    });
  });
});
