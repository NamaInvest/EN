import Module from 'module';

// 1. Mock auth user session
let activeUser = {
  id: 123,
  userId: 123,
  role: 'compliance_officer',
  tenantId: 'tenant_mock_456',
  email: 'compliance@namainvist.com',
  username: 'compliance@namainvist.com',
};

// Intercept Node's require for dynamic CJS require('@/lib/auth') calls
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
import { NextRequest } from 'next/server';

// 2. Mock Prisma client and context
const mockPrisma = {
  $transaction: vi.fn(async (cb) => cb(mockPrisma)),
  user: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
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

// Mock the static import of @/lib/auth
vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn(() => activeUser),
  getAuthSession: vi.fn(async () => activeUser),
  requireAuth: vi.fn(async () => activeUser),
}));

// 3. Mock mudad compliance library
vi.mock('@/lib/mudad-compliance', () => ({
  checkMudadCompliance: vi.fn(async () => ({ isCompliant: true, compliancePct: 95 })),
  getUnprotectedEmployees: vi.fn(async () => [
    { id: 1, name: 'Employee A', mudadStatus: 'PENDING' }
  ]),
  generateMudadReport: vi.fn(async () => ({ month: '2026-06', totalCount: 10, compliantCount: 9 })),
  bulkUpdateMudadStatus: vi.fn(async () => ({ updated: 1, errors: [] })),
}));

// Mock audit log action helper
vi.mock('@/lib/audit', () => ({
  logAuditAction: vi.fn(async () => true),
}));

// Import target routes under test
import { GET as getMudad, POST as postMudad } from '@/app/api/hr/mudad/compliance/route';

describe('SCN-COMP-001: Wages Protection & Mudad Compliance API Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeUser = {
      id: 123,
      userId: 123,
      role: 'compliance_officer',
      tenantId: 'tenant_mock_456',
      email: 'compliance@namainvist.com',
      username: 'compliance@namainvist.com',
    };
  });

  it('should deny access if the user role is not allowed', async () => {
    activeUser.role = 'CASHIER'; // Cashier is not in ALLOWED_ROLES

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CASHIER',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/hr/mudad/compliance?view=dashboard', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      }
    });

    const response = await getMudad(req);
    expect(response.status).toBe(403);
  });

  it('should fetch mudad dashboard data for authorized role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'compliance_officer',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/hr/mudad/compliance?view=dashboard', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      }
    });

    const response = await getMudad(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.compliance.compliancePct).toBe(95);
    expect(body.unprotected.count).toBe(1);
  });

  it('should fetch mudad compliance report', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'compliance_officer',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/hr/mudad/compliance?view=report&month=2026-06', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      }
    });

    const response = await getMudad(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.month).toBe('2026-06');
  });

  it('should successfully batch update employees mudad compliance status', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'compliance_officer',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/hr/mudad/compliance', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        updates: [
          { employeeId: 10, status: 'ACTIVE' }
        ]
      })
    });

    const response = await postMudad(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.updated).toBe(1);
  });
});
