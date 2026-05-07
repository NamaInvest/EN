import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/audit/field-trail
 * 
 * Advanced search with filters:
 *   ?tableName=Customer
 *   &recordId=15
 *   &changedBy=3
 *   &fieldName=creditLimit
 *   &dateFrom=2026-01-01
 *   &dateTo=2026-03-31
 *   &page=1
 *   &limit=50
 *   &stats=true  (returns aggregate stats instead of rows)
 *   &export=csv  (returns CSV download)
 */
export async function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');
    const recordId = searchParams.get('recordId');
    const changedBy = searchParams.get('changedBy');
    const fieldName = searchParams.get('fieldName');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const stats = searchParams.get('stats');
    const exportFormat = searchParams.get('export');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tableName) where.tableName = tableName;
    if (recordId) where.recordId = parseInt(recordId);
    if (changedBy) where.changedBy = parseInt(changedBy);
    if (fieldName) where.fieldName = { contains: fieldName };
    if (dateFrom || dateTo) {
      where.changedAt = {};
      if (dateFrom) where.changedAt.gte = new Date(dateFrom);
      if (dateTo) where.changedAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const db = prisma as any;

    // ─── Stats mode ──────────────────────────────────────────────────
    if (stats === 'true') {
      const [total, byTable, byUser, recentActivity] = await Promise.all([
        db.fieldAuditTrail.count({ where }),
        db.fieldAuditTrail.groupBy({
          by: ['tableName'],
          where,
          _count: true,
          orderBy: { _count: { tableName: 'desc' } },
          take: 20,
        }),
        db.fieldAuditTrail.groupBy({
          by: ['changedBy'],
          where,
          _count: true,
          orderBy: { _count: { changedBy: 'desc' } },
          take: 10,
        }),
        db.fieldAuditTrail.findMany({
          where,
          orderBy: { changedAt: 'desc' },
          take: 5,
          select: { tableName: true, recordId: true, fieldName: true, changedAt: true, changedBy: true },
        }),
      ]);

      // Enrich byUser with usernames
      const userIds = byUser.map((u: any) => u.changedBy).filter(Boolean);
      const users = userIds.length > 0
        ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, fullName: true } })
        : [];
      const userMap = new Map(users.map((u: any) => [u.id, u.fullName || u.username]));

      return NextResponse.json({
        total,
        byTable: byTable.map((r: any) => ({ table: r.tableName, count: r._count })),
        byUser: byUser.map((r: any) => ({ userId: r.changedBy, name: userMap.get(r.changedBy) || `User #${r.changedBy}`, count: r._count })),
        recentActivity,
      });
    }

    // ─── Normal list mode ────────────────────────────────────────────
    const [logs, total] = await Promise.all([
      db.fieldAuditTrail.findMany({
        where,
        orderBy: { changedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.fieldAuditTrail.count({ where }),
    ]);

    // Enrich with user names
    const userIds = [...new Set(logs.map((l: any) => l.changedBy).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds as number[] } }, select: { id: true, username: true, fullName: true } })
      : [];
    const userMap = new Map(users.map((u: any) => [u.id, u.fullName || u.username]));

    const enriched = logs.map((l: any) => ({
      ...l,
      userName: userMap.get(l.changedBy) || `User #${l.changedBy}`,
    }));

    // ─── CSV Export ──────────────────────────────────────────────────
    if (exportFormat === 'csv') {
      const header = 'ID,Table,RecordID,Field,OldValue,NewValue,ChangedBy,UserName,ChangedAt,IP\n';
      const rows = enriched.map((l: any) =>
        `${l.id},"${l.tableName}",${l.recordId},"${l.fieldName}","${(l.oldValue || '').replace(/"/g, '""')}","${(l.newValue || '').replace(/"/g, '""')}",${l.changedBy},"${l.userName}",${l.changedAt},"${l.ipAddress || ''}"`
      ).join('\n');

      return new NextResponse(header + rows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-trail-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'audit/field-trail' });
  }
}
