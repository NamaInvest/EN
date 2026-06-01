/* eslint-disable @typescript-eslint/no-explicit-any */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  getPrisma: jest.fn(),
}));

jest.mock('@/lib/api/with-route', () => ({
  withRoute: (handler: any) => {
    return async (req: any) => {
      const { searchParams } = new URL(req.url);
      const isUnauth = searchParams.get('test_unauth') === 'true';
      
      const ctx = {
        req,
        tenant: isUnauth ? null : 'test-tenant',
        auth: { userId: isUnauth ? null : 1 },
        prisma: getPrisma(req),
      };
      
      return handler(ctx);
    };
  }
}));

describe('Budget Variance API Route (F-15)', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      budget: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Annual Budget 2026',
            tenantId: 'test-tenant',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            lines: [
              {
                id: 10,
                accountId: 101,
                costCenterId: 5,
                allocatedAmount: 10000,
                account: { id: 101, code: '5001', name: 'Marketing' },
                costCenter: { id: 5, name: 'Operations CC' },
              }
            ]
          }
        ]),
      },
      journalLine: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            debit: 3500,
            credit: 500,
          }
        }),
      }
    };

    (getPrisma as jest.Mock).mockReturnValue(mockPrisma);
  });

  it('يجب تصفية الموازنات بدقة للمستأجر الحالي وحساب الانحراف المالي', async () => {
    const req = new NextRequest('http://localhost/api/budgeting/variance');
    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].budgetId).toBe(1);
    expect(data[0].name).toBe('Annual Budget 2026');
    expect(data[0].totalAllocated).toBe(10000);
    
    const v = data[0].variances[0];
    expect(v.accountName).toBe('Marketing');
    expect(v.costCenterName).toBe('Operations CC');
    expect(v.allocated).toBe(10000);
    expect(v.spent).toBe(3000); // 3500 - 500 = 3000
    expect(v.variance).toBe(7000); // 10000 - 3000 = 7000
    expect(v.status).toBe('FAVORABLE');

    expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'test-tenant',
        })
      })
    );
  });
});
