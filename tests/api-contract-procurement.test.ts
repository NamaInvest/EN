import Module from 'module';

// 2. Mock auth user session
let activeUser = {
  id: 123,
  userId: 123,
  role: 'CFO',
  tenantId: 'tenant_mock_456',
  email: 'cfo@namainvist.com',
  username: 'cfo@namainvist.com',
};

// Intercept Node's require for dynamic CJS require('@/lib/auth') calls inside route handlers
const originalRequire = Module.prototype.require;
Module.prototype.require = function (this: any, id: string) {
  if (id === '@/lib/auth') {
    return {
      getUserFromRequest: () => activeUser,
      getAuthSession: async () => activeUser,
      requireAuth: async () => activeUser,
    };
  }
  return originalRequire.call(this, id);
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// 1. Mock Prisma client and context
const mockPrisma = {
  $transaction: vi.fn(async (cb) => cb(mockPrisma)),
  user: {
    findUnique: vi.fn(),
  },
  purchaseOrder: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  approvalStep: {
    findMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  setting: {
    findFirst: vi.fn(),
  }
};

vi.mock('@/lib/prisma', () => ({
  getPrisma: vi.fn(() => mockPrisma),
  resolveTenantContext: vi.fn(() => ({
    tenantSlug: 'tenant_mock_456',
    tenantId: 'tenant_mock_456',
    name: 'Mock Company',
    status: 'ACTIVE'
  })),
  currentRequestStore: {
    run: vi.fn((tenant, cb) => cb()),
  }
}));

// Mock the static import of @/lib/auth for withRoute and other files
vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn(() => activeUser),
  getAuthSession: vi.fn(async () => activeUser),
  requireAuth: vi.fn(async () => activeUser),
}));

// 3. Mock Saga Orchestrator
vi.mock('@/lib/workflow/saga/purchase-sagas', () => ({
  buildPurchaseOrderSaga: vi.fn(() => ({
    execute: vi.fn(async (ctx) => {
      return {
        purchaseOrderId: 101,
        approvalRequestId: ctx.data.requireApproval ? 202 : undefined,
      };
    }),
  })),
  buildGRNSaga: vi.fn(() => ({
    execute: vi.fn(async () => ({
      grnId: 303,
    })),
  })),
}));

// 4. Mock Tax Validation
vi.mock('@/lib/tax-validation', () => ({
  validateTaxRate: vi.fn(async (taxRate: number) => {
    if (taxRate === 15 || taxRate === 0) {
      return { valid: true, normalizedRate: taxRate, allowedRates: [0, 15] };
    }
    return {
      valid: false,
      normalizedRate: taxRate,
      allowedRates: [0, 15],
      error: `Tax rate ${taxRate} is not allowed`
    };
  }),
}));

// 5. Mock Period Lock
vi.mock('@/lib/governance/period-lock', () => ({
  assertPeriodWritable: vi.fn(async () => true),
  PeriodLockViolation: class extends Error {
    code = 'LOCKED';
  }
}));

// Import target routes under test
import { GET as getPurchaseOrders, POST as createPurchaseOrder } from '@/app/api/purchase-orders/route';
import { GET as getApprovals } from '@/app/api/approvals/route';

describe('SCN-PUR-001: Purchase Order Draft Creation & Tax Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default CFO user configuration
    activeUser = {
      id: 123,
      userId: 123,
      role: 'CFO',
      tenantId: 'tenant_mock_456',
      email: 'cfo@namainvist.com',
      username: 'cfo@namainvist.com',
    };
  });

  it('should deny PO creation if the user lacks purchases module permissions', async () => {
    // Mock user database record to have view permission only (no add permission)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'user',
      permissions: [
        { module: 'purchases', canView: true, canAdd: false }
      ]
    });

    const req = new NextRequest('http://localhost/api/purchase-orders', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        date: '2026-06-07',
        items: [{ productId: 1, quantity: 5, unitCost: 100, taxRate: 15 }]
      })
    });

    const response = await createPurchaseOrder(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Forbidden');
  });

  it('should validate and create PO draft when user has permissions and tax is valid', async () => {
    // CFO has bypass/admin-level permission or direct add permission
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: [
        { module: 'purchases', canView: true, canAdd: true }
      ]
    });

    const req = new NextRequest('http://localhost/api/purchase-orders', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        date: '2026-06-07',
        items: [{ productId: 1, quantity: 10, unitCost: 50, taxRate: 15 }],
        requireApproval: true
      })
    });

    const response = await createPurchaseOrder(req);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.purchaseOrderId).toBe(101);
    expect(body.approvalRequestId).toBe(202);
    expect(body.status).toBe('pending_approval');
  });

  it('should fail PO creation with 422 if tax rate is invalid', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: [
        { module: 'purchases', canView: true, canAdd: true }
      ]
    });

    const req = new NextRequest('http://localhost/api/purchase-orders', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        date: '2026-06-07',
        items: [{ productId: 1, quantity: 10, unitCost: 50, taxRate: 17 }] // Invalid tax rate 17%
      })
    });

    const response = await createPurchaseOrder(req);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe('INVALID_TAX_RATE');
    expect(body.error).toContain('Tax rate 17 is not allowed');
  });

  it('should return 400 status if item schema validation fails', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: [
        { module: 'purchases', canView: true, canAdd: true }
      ]
    });

    const req = new NextRequest('http://localhost/api/purchase-orders', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        date: '2026-06-07',
        items: [] // Empty items list violates z.array().min(1)
      })
    });

    const response = await createPurchaseOrder(req);
    expect(response.status).toBe(400);
  });
});

describe('SCN-APP-001: Document Workflow Approvals Pending Listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return pending approvals step list for authorized tenant user', async () => {
    const mockPendingSteps = [
      { id: 1, tenantId: 'tenant_mock_456', status: 'PENDING', approverId: 123, request: { id: 10, documentType: 'PURCHASE_ORDER' } }
    ];
    mockPrisma.approvalStep.findMany.mockResolvedValue(mockPendingSteps);

    const req = new NextRequest('http://localhost/api/approvals', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      }
    });

    const response = await getApprovals(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(1);
    expect(body[0].tenantId).toBe('tenant_mock_456');
    expect(body[0].approverId).toBe(123);
  });
});
