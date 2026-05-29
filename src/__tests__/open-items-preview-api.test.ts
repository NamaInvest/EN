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

// Mock Open Items Service Preview Methods
jest.mock('@/lib/services/open-items.service', () => ({
  OpenItemsService: {
    previewCustomerAllocation: jest.fn(),
    previewSupplierAllocation: jest.fn(),
    previewReverseAllocation: jest.fn(),
    allocateCustomerPayment: jest.fn(),
    allocateSupplierPayment: jest.fn(),
    reverseAllocation: jest.fn(),
  },
}));

import { POST as previewCustomerPOST } from '../app/api/open-items/preview/customer-allocation/route';
import { POST as previewSupplierPOST } from '../app/api/open-items/preview/supplier-allocation/route';
import { POST as previewReversalPOST } from '../app/api/open-items/preview/reversal/route';
import { getUserFromRequest } from '@/lib/auth';
import { OpenItemsService } from '@/lib/services/open-items.service';

describe('Open Items POST Preview API Endpoints (Phase OPEN-ITEMS-02D)', () => {
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

  describe('Customer Allocation Preview API', () => {
    it('1. should reject request if body parameters are invalid/missing', async () => {
      const req = new NextRequest('http://localhost/api/open-items/preview/customer-allocation', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await previewCustomerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid request body parameters');
    });

    it('2. should successfully invoke dry-run calculation and return preview DTO', async () => {
      const mockPreviewResult = {
        canProceed: true,
        type: 'CUSTOMER_RECEIPT',
        tenantId: secureTenant,
        partnerId: 102,
        totalRequestedAmount: 500,
        totalAllocatedAmount: 500,
        unallocatedAmount: 0,
        affectedInvoices: [],
        blockingErrors: [],
        warnings: [],
        dryRun: true,
      };

      (OpenItemsService.previewCustomerAllocation as any).mockResolvedValue(mockPreviewResult);

      const req = new NextRequest('http://localhost/api/open-items/preview/customer-allocation', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: 102,
          treasuryId: 450,
          allocations: [{ salesInvoiceId: 12, amount: 500 }],
        }),
      });

      const res = await previewCustomerPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.canProceed).toBe(true);
      expect(data.dryRun).toBe(true);
      expect(data.totalRequestedAmount).toBe(500);

      // Verify mutation function was absolutely not called
      expect(OpenItemsService.allocateCustomerPayment).not.toHaveBeenCalled();
    });
  });

  describe('Supplier Allocation Preview API', () => {
    it('3. should successfully simulate supplier payment allocation', async () => {
      const mockPreviewResult = {
        canProceed: true,
        type: 'SUPPLIER_PAYMENT',
        tenantId: secureTenant,
        partnerId: 105,
        totalRequestedAmount: 1000,
        totalAllocatedAmount: 1000,
        unallocatedAmount: 0,
        affectedInvoices: [],
        blockingErrors: [],
        warnings: [],
        dryRun: true,
      };

      (OpenItemsService.previewSupplierAllocation as any).mockResolvedValue(mockPreviewResult);

      const req = new NextRequest('http://localhost/api/open-items/preview/supplier-allocation', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: 105,
          treasuryId: 702,
          allocations: [{ purchaseInvoiceId: 601, amount: 1000 }],
        }),
      });

      const res = await previewSupplierPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.canProceed).toBe(true);
      expect(data.dryRun).toBe(true);
      expect(data.type).toBe('SUPPLIER_PAYMENT');

      expect(OpenItemsService.allocateSupplierPayment).not.toHaveBeenCalled();
    });
  });

  describe('Reversal Preview API', () => {
    it('4. should reject reversal preview if reason is too short', async () => {
      const req = new NextRequest('http://localhost/api/open-items/preview/reversal', {
        method: 'POST',
        body: JSON.stringify({
          matchingId: 901,
          reason: 'short',
        }),
      });

      const res = await previewReversalPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.details.reason[0]).toContain('minimum 10 characters');
    });

    it('5. should successfully simulate matching allocation reversal', async () => {
      const mockPreviewResult = {
        canProceed: true,
        type: 'REVERSAL',
        tenantId: secureTenant,
        matchingId: 901,
        affectedInvoices: [],
        blockingErrors: [],
        warnings: [],
        dryRun: true,
      };

      (OpenItemsService.previewReverseAllocation as any).mockResolvedValue(mockPreviewResult);

      const req = new NextRequest('http://localhost/api/open-items/preview/reversal', {
        method: 'POST',
        body: JSON.stringify({
          matchingId: 901,
          reason: 'Valid matching correction reason',
        }),
      });

      const res = await previewReversalPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.canProceed).toBe(true);
      expect(data.dryRun).toBe(true);

      expect(OpenItemsService.reverseAllocation).not.toHaveBeenCalled();
    });
  });

  describe('Dry-Run Safety Enforcement (Phase OPEN-ITEMS-02H)', () => {
    it('6. should reject customer preview if dryRun is explicitly set to false', async () => {
      const req = new NextRequest('http://localhost/api/open-items/preview/customer-allocation', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: 102,
          treasuryId: 450,
          allocations: [{ salesInvoiceId: 12, amount: 500 }],
          dryRun: false,
        }),
      });

      const res = await previewCustomerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid request body parameters');
      expect(data.details.dryRun[0]).toContain('strictly forbidden');
    });

    it('7. should reject supplier preview if dryRun is explicitly set to false', async () => {
      const req = new NextRequest('http://localhost/api/open-items/preview/supplier-allocation', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: 105,
          treasuryId: 702,
          allocations: [{ purchaseInvoiceId: 601, amount: 1000 }],
          dryRun: false,
        }),
      });

      const res = await previewSupplierPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid request body parameters');
      expect(data.details.dryRun[0]).toContain('strictly forbidden');
    });

    it('8. should reject reversal preview if dryRun is explicitly set to false', async () => {
      const req = new NextRequest('http://localhost/api/open-items/preview/reversal', {
        method: 'POST',
        body: JSON.stringify({
          matchingId: 901,
          reason: 'Valid matching correction reason',
          dryRun: false,
        }),
      });

      const res = await previewReversalPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid request body parameters');
      expect(data.details.dryRun[0]).toContain('strictly forbidden');
    });
  });
});

