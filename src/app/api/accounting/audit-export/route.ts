/**
 * Audit Trail Export API
 * GET /api/accounting/audit-export?tenantId=X&from=&to=&table=&action=&format=csv|json
 *
 * يُصدِّر سجل التدقيق للمراجعين الخارجيين بصيغة CSV أو JSON
 * يغطي: القيود المحاسبية، الفواتير، الدفعات، التعديلات
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const from      = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const to        = searchParams.get('to')   ? new Date(searchParams.get('to')! + 'T23:59:59') : new Date();
  const table     = searchParams.get('table');
  const action    = searchParams.get('action');
  const userId    = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
  const format    = (searchParams.get('format') ?? 'json').toLowerCase() as 'csv' | 'json';
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '1000'), 5000);

  const p = getPrisma(req as any) as any;

  const where: any = {
    tenantId,
    createdAt: { gte: from, lte: to },
  };
  if (table)  where.tableName = table;
  if (action) where.action    = action;
  if (userId) where.userId    = userId;

  const logs = await p.auditLog?.findMany?.({
    where,
    orderBy: { createdAt: 'desc' },
    take:    limit,
    select: {
      id: true, tableName: true, recordId: true, action: true,
      userId: true, createdAt: true, diff: true,
      user: { select: { name: true, username: true } },
    },
  }).catch(() => []) ?? [];

  if (format === 'csv') {
    const header = 'id,tableName,recordId,action,userId,userName,createdAt,changes\n';
    const rows   = logs.map((l: any) =>
      [
        l.id, l.tableName, l.recordId, l.action,
        l.userId, (l.user?.name ?? l.user?.username ?? '').replace(/,/g, ';'),
        l.createdAt?.toISOString?.() ?? '',
        JSON.stringify(l.diff ?? {}).replace(/"/g, '""'),
      ].map(v => `"${v}"`).join(',')
    ).join('\n');

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_${tenantId}_${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    tenantId,
    period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
    filters: { table, action, userId },
    count:  logs.length,
    logs:   logs.map((l: any) => ({ ...l, createdAt: l.createdAt?.toISOString?.() })),
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', roles: ['admin','auditor','CFO'] });
