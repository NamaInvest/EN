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
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

  const auth = getUserFromRequest(request as any);
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
    if (changedBy) where.userId = parseInt(changedBy);
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59');
    }

    const db = prisma as any;

    // ─── Stats mode ──────────────────────────────────────────────────
    if (stats === 'true') {
      const [total, byTable, byUser, recentActivity] = await Promise.all([
        db.auditLog.count({ where }),
        db.auditLog.groupBy({
          by: ['tableName'],
          where,
          _count: true,
          orderBy: { _count: { tableName: 'desc' } },
          take: 20,
        }),
        db.auditLog.groupBy({
          by: ['userId'],
          where,
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),
        db.auditLog.findMany({
          where,
          orderBy: { date: 'desc' },
          take: 5,
          select: { tableName: true, recordId: true, date: true, userId: true },
        }),
      ]);

      // Enrich byUser with usernames
      const userIds = byUser.map((u: any) => u.userId).filter(Boolean);
      const users = userIds.length > 0
        ? await prisma.user.findMany({
            take: 100, where: { id: { in: userIds } }, select: { id: true, username: true, fullName: true } })
        : [];
      const userMap = new Map(users.map((u: any) => [u.id, u.fullName || u.username]));

      return NextResponse.json({
        total,
        byTable: byTable.map((r: any) => ({ table: r.tableName, count: r._count })),
        byUser: byUser.map((r: any) => ({ userId: r.userId, name: userMap.get(r.userId) || `User #${r.userId}`, count: r._count })),
        recentActivity,
      });
    }

    // ─── Normal list mode ────────────────────────────────────────────
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Enrich with user names
    const userIds = [...new Set(logs.map((l: any) => l.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
            take: 100, where: { id: { in: userIds as number[] } }, select: { id: true, username: true, fullName: true } })
      : [];
    const userMap = new Map(users.map((u: any) => [u.id, u.fullName || u.username]));

    const enriched = logs.flatMap((l: any) => {
      const base = {
        ...l,
        changedBy: l.userId,
        changedAt: l.date,
        userName: userMap.get(l.userId) || `User #${l.userId}`,
      };

      if (!l.diff || typeof l.diff !== 'object') {
        return [{ ...base, fieldName: 'N/A', oldValue: null, newValue: null }];
      }

      if (l.diff.before && !l.diff.after && !Object.keys(l.diff).some(k => k !== 'before')) {
        return [{ ...base, fieldName: '__entity__', oldValue: JSON.stringify(l.diff.before), newValue: null }];
      }
      
      if (l.diff.after && !l.diff.before && !Object.keys(l.diff).some(k => k !== 'after')) {
        return [{ ...base, fieldName: '__entity__', oldValue: null, newValue: JSON.stringify(l.diff.after) }];
      }

      const keys = Object.keys(l.diff);
      if (keys.length === 0) return [{ ...base, fieldName: 'N/A', oldValue: null, newValue: null }];

      return keys.map(k => ({
        ...base,
        fieldName: k,
        oldValue: l.diff[k]?.before !== undefined ? String(l.diff[k].before) : null,
        newValue: l.diff[k]?.after !== undefined ? String(l.diff[k].after) : null,
      }));
    });

    // ─── CSV Export ──────────────────────────────────────────────────
    if (exportFormat === 'csv') {
      const header = 'ID,Table,RecordID,Action,ChangedBy,UserName,ChangedAt,IP\n';
      const rows = enriched.map((l: any) =>
        `${l.id},"${l.tableName}",${l.recordId},"${l.action}",${l.userId},"${l.userName}",${l.date},"${l.ipAddress || ''}"`
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
