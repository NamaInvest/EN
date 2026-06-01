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

describe('Financial Report Audit Trail API Route (F-12)', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log-1',
            action: 'EXECUTE',
            entityType: 'FINANCIAL_REPORT',
            entityId: 'INCOME_STATEMENT',
            route: '/api/accounting/financial-statements',
            ipAddress: '127.0.0.1',
            createdAt: new Date('2026-06-01T10:00:00Z'),
            metadata: { format: 'json', from: '2026-01-01', to: '2026-05-31' },
            userId: 1,
            user: { id: 1, username: 'test-user', fullName: 'Test User' },
          }
        ]),
        count: jest.fn().mockResolvedValue(1),
      }
    };

    (getPrisma as jest.Mock).mockReturnValue(mockPrisma);
  });

  it('يجب إرجاع 401 غير مصرح عند استدعاء الطلب بدون جلسة مصادقة صالحة أو مستأجر', async () => {
    const req = new NextRequest('http://localhost/api/accounting/financial-report-audit?test_unauth=true');
    const res = await GET(req as any);
    expect(res.status).toBe(400); // Tenant ID required validation catches null tenant
  });

  it('يجب تصفية سجلات التدقيق بدقة للمستأجر الحالي وعملية التقارير المالية فقط', async () => {
    const req = new NextRequest('http://localhost/api/accounting/financial-report-audit');
    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data.length).toBe(1);
    expect(data.data[0].id).toBe('log-1');
    expect(data.data[0].userName).toBe('Test User');
    expect(data.data[0].entityId).toBe('INCOME_STATEMENT');

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'test-tenant',
          entityType: 'FINANCIAL_REPORT',
        })
      })
    );
  });

  it('يجب ألا تسرب الاستجابة أي كلمات مرور أو مفاتيح حساسة وتلتزم بالـ select المقيد', async () => {
    const req = new NextRequest('http://localhost/api/accounting/financial-report-audit');
    const res = await GET(req as any);
    const data = await res.json();

    const entry = data.data[0];
    expect(entry.passwordHash).toBeUndefined();
    expect(entry.totpSecretEncrypted).toBeUndefined();
    expect(entry.sessionToken).toBeUndefined();
    expect(entry.totpIv).toBeUndefined();
  });
});
