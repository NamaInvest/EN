import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// ── Mock Dependencies ────────────────────────────────────────────────────────

// Mock Redis to prevent real connection attempts during tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      incr: jest.fn().mockImplementation(() => Promise.resolve(1)),
      pexpire: jest.fn().mockImplementation(() => Promise.resolve(true)),
    };
  });
});

// Mock Next.js metrics and instrumentation
jest.mock('@/lib/instrumentation/metrics', () => ({
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any),
  },
}));

// Mock Auth logic
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
}));

// Mock database prisma provider with fully compatible tenant stores
jest.mock('@/lib/prisma', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(() => Promise.resolve({ id: 42, role: 'admin', permissions: [] })),
    },
  };
  return {
    prisma: mockPrismaClient,
    getPrisma: jest.fn().mockReturnValue(mockPrismaClient),
    resolveTenantContext: jest.fn().mockReturnValue({
      tenantSlug: 'test-tenant-slug',
      tenantId: 'test-tenant-slug',
      mode: 'request',
    }),
    currentRequestStore: {
      run: (tenant: string, cb: () => any) => cb(),
    },
  };
});

// Mock tenant-guard
jest.mock('@/lib/governance/tenant-guard', () => ({
  requireTenantId: jest.fn().mockReturnValue('test-tenant-slug'),
  assertTenantContextMatch: jest.fn(),
}));

// Mock Open Items Service
jest.mock('@/lib/services/open-items.service', () => ({
  OpenItemsService: {
    getOpenItems: jest.fn(),
    allocateCustomerPayment: jest.fn(), // should not be called by GET API
  },
}));

import { GET } from '../app/api/open-items/route';
import { getUserFromRequest } from '@/lib/auth';
import { OpenItemsService } from '@/lib/services/open-items.service';

describe('Open Items Read-Only API Preview (Phase OPEN-ITEMS-01G)', () => {
  const secureTenant = 'test-tenant-slug';

  beforeEach(() => {
    jest.clearAllMocks();

    (getUserFromRequest as any).mockReturnValue({
      tenantId: secureTenant,
      userId: 42,
      role: 'admin',
      username: 'test-user',
    });
  });

  it('1. should reject request if customerId query parameter is missing', async () => {
    const req = new NextRequest('http://localhost/api/open-items', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('parameter is strictly required');
  });

  it('2. should reject request if customerId query parameter is not a number', async () => {
    const req = new NextRequest('http://localhost/api/open-items?customerId=abc', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid customerId/partnerId');
  });

  it('3. should successfully return open items for valid customer parameter', async () => {
    const mockData = {
      salesInvoices: [{ id: 501, invoiceNo: 1001, total: 1000, remaining: 1000 }],
      purchaseInvoices: [],
      openReceipts: [],
    };

    (OpenItemsService.getOpenItems as any).mockResolvedValue(mockData);

    const req = new NextRequest('http://localhost/api/open-items?customerId=12', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.salesInvoices).toHaveLength(1);
    expect(data.salesInvoices[0].id).toBe(501);

    // Verify service called with correct arguments
    expect(OpenItemsService.getOpenItems).toHaveBeenCalledWith(
      expect.any(Object),
      secureTenant,
      12
    );

    // Verify mutation function was absolutely not called
    expect(OpenItemsService.allocateCustomerPayment).not.toHaveBeenCalled();
  });
});
