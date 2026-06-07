import Module from 'module';

// 1. Mock auth user session
let activeUser = {
  id: 123,
  userId: 123,
  role: 'CFO',
  tenantId: 'tenant_mock_456',
  email: 'cfo@namainvist.com',
  username: 'cfo@namainvist.com',
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
  setting: {
    findUnique: vi.fn(async ({ where }) => {
      if (where.key === 'gemini_api_key') {
        return { key: 'gemini_api_key', value: 'mocked_key' };
      }
      return null;
    }),
  },
  salesInvoice: {
    aggregate: vi.fn(async () => ({ _sum: { total: 50000, subtotal: 45000 } })),
  },
  purchaseInvoice: {
    aggregate: vi.fn(async () => ({ _sum: { total: 20000 } })),
  },
  salesInvoiceDetail: {
    groupBy: vi.fn(async () => [
      { productId: 1, productName: 'Product A', _sum: { quantity: 100, total: 10000 } }
    ]),
  },
  product: {
    findMany: vi.fn(async () => [
      { id: 2, name: 'Product B', currentStock: 50, sellPrice: 200, buyPrice: 100 }
    ]),
    aggregate: vi.fn(async () => ({ _sum: { currentStock: 150 } })),
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

// Mock static imports
vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn(() => activeUser),
  getAuthSession: vi.fn(async () => activeUser),
  requireAuth: vi.fn(async () => activeUser),
}));

// Mock prompt registry
vi.mock('@/lib/prompts/registry', () => ({
  getPrompt: vi.fn(async () => ({ userTemplate: 'template text' })),
  renderPrompt: vi.fn(() => 'rendered prompt text'),
}));

// Mock privacy filters
vi.mock('@/lib/privacy-filter', () => ({
  redactPII: vi.fn((text) => text),
  maskEntityNames: vi.fn((list) => list),
}));

// Mock Google Generative AI SDK
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: async () => ({
            response: {
              text: () => JSON.stringify({ 
                success: true, 
                insights: "Gemini analysis summary mocked result" 
              })
            }
          })
        };
      }
    }
  };
});

// Mock Global Fetch for Gemini API HTTP endpoint
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    candidates: [
      {
        content: {
          parts: [
            { text: JSON.stringify({ insights: "Direct Gemini POST response mocked result" }) }
          ]
        }
      }
    ]
  }),
});

import { POST as postCfoInsights } from '@/app/api/ai-cfo/route';
import { GET as getCfoReport } from '@/app/api/ai-cfo/report/route';

describe('SCN-AI-001: AI CFO Financial Auditor API Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully post metrics and retrieve Gemini insights', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/ai-cfo', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        metrics: {
          todaySales: 15000,
          todayPurchases: 5000,
          todayExpenses: 2000,
          todayProfit: 8000,
          treasuryBalance: 250000,
          lowStockCount: 4,
          topProducts: [{ name: 'Product A', quantity: 20 }]
        }
      })
    });

    const response = await postCfoInsights(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.insights).toContain('Direct Gemini POST response mocked result');
  });

  it('should generate monthly financial audit report via Google SDK', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/ai-cfo/report', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      }
    });

    const response = await getCfoReport(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.report.insights).toContain('Gemini analysis summary mocked result');
  });
});
