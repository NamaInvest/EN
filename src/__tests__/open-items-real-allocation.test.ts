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

// Mock Next.js metrics and logger
jest.mock('@/lib/instrumentation/metrics', () => ({
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
}));

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

// Mock Transaction wrapper to immediately run target callback
jest.mock('@/lib/db/transaction', () => ({
  runFinancialTx: jest.fn((prisma: any, cb: any) => cb(prisma)),
}));

// Mock Open Items Service Execution Methods
jest.mock('@/lib/services/open-items.service', () => ({
  OpenItemsService: {
    allocateCustomerPayment: jest.fn(),
    allocateSupplierPayment: jest.fn(),
    reverseAllocation: jest.fn(),
  },
}));

import { POST as realCustomerPOST } from '../app/api/open-items/allocate/customer-allocation/route';
import { POST as realSupplierPOST } from '../app/api/open-items/allocate/supplier-allocation/route';
import { POST as realReversalPOST } from '../app/api/open-items/allocate/reversal/route';
import { getUserFromRequest } from '@/lib/auth';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { runFinancialTx } from '@/lib/db/transaction';

describe('Open Items POST Real Allocation API Endpoints (Phase OPEN-ITEMS-03)', () => {
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

  describe('Real Customer Allocation API', () => {
    it('1. should reject request if body parameters are invalid/missing', async () => {
      const req = new NextRequest('http://localhost/api/open-items/allocate/customer-allocation', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await realCustomerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid request body parameters');
    });

    it('2. should execute actual allocation inside transaction and return success matches', async () => {
      const mockMatchRecord = {
        id: 7001,
        tenantId: secureTenant,
        salesInvoiceId: 12,
        treasuryId: 450,
        amount: 500,
        status: 'ACTIVE',
      };

      (OpenItemsService.allocateCustomerPayment as any).mockResolvedValue(mockMatchRecord);

      const req = new NextRequest('http://localhost/api/open-items/allocate/customer-allocation', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: 102,
          treasuryId: 450,
          allocations: [{ salesInvoiceId: 12, amount: 500 }],
        }),
      });

      const res = await realCustomerPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.matches[0].id).toBe(7001);
      expect(data.matches[0].amount).toBe(500);

      // Verify transaction wrapper and service method were called
      expect(runFinancialTx).toHaveBeenCalled();
      expect(OpenItemsService.allocateCustomerPayment).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: secureTenant,
          salesInvoiceId: 12,
          treasuryId: 450,
          amount: 500,
          allocatedBy: 'test-user',
          sourceType: 'API',
          userId: '42',
        })
      );
    });
  });

  describe('Real Supplier Allocation API', () => {
    it('3. should successfully execute supplier payment allocation inside transaction', async () => {
      const mockMatchRecord = {
        id: 8002,
        tenantId: secureTenant,
        purchaseInvoiceId: 601,
        treasuryId: 702,
        amount: 1000,
        status: 'ACTIVE',
      };

      (OpenItemsService.allocateSupplierPayment as any).mockResolvedValue(mockMatchRecord);

      const req = new NextRequest('http://localhost/api/open-items/allocate/supplier-allocation', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: 105,
          treasuryId: 702,
          allocations: [{ purchaseInvoiceId: 601, amount: 1000 }],
        }),
      });

      const res = await realSupplierPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.matches[0].id).toBe(8002);
      expect(data.matches[0].amount).toBe(1000);

      expect(runFinancialTx).toHaveBeenCalled();
      expect(OpenItemsService.allocateSupplierPayment).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          tenantId: secureTenant,
          purchaseInvoiceId: 601,
          treasuryId: 702,
          amount: 1000,
          allocatedBy: 'test-user',
          sourceType: 'API',
          userId: '42',
        })
      );
    });
  });

  describe('Real Reversal API', () => {
    it('4. should reject reversal if reason is too short', async () => {
      const req = new NextRequest('http://localhost/api/open-items/allocate/reversal', {
        method: 'POST',
        body: JSON.stringify({
          matchingId: 901,
          reason: 'short',
        }),
      });

      const res = await realReversalPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.details.reason[0]).toContain('minimum 10 characters');
    });

    it('5. should successfully execute matching allocation reversal', async () => {
      (OpenItemsService.reverseAllocation as any).mockResolvedValue(undefined);

      const req = new NextRequest('http://localhost/api/open-items/allocate/reversal', {
        method: 'POST',
        body: JSON.stringify({
          matchingId: 901,
          reason: 'Valid matching correction reason',
        }),
      });

      const res = await realReversalPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('reversed and settled balances restored');

      expect(runFinancialTx).toHaveBeenCalled();
      expect(OpenItemsService.reverseAllocation).toHaveBeenCalledWith(
        expect.any(Object),
        secureTenant,
        901,
        '42',
        'Valid matching correction reason',
        undefined
      );
    });
  });
});
