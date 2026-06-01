import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';
import type { PrismaClient } from '@prisma/client';

const log = logger.child({ service: 'accounting.financial-report-audit' });

interface AuditLogQueryWhere {
  tenantId: string;
  entityType: string;
  entityId?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

interface AuditLogRaw {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  route: string | null;
  ipAddress: string | null;
  createdAt: Date;
  metadata: unknown;
  userId: number | null;
  user: {
    id: number;
    username: string;
    fullName: string | null;
  } | null;
}

async function _GET(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = ctx.tenant;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('reportType');
    const dateFrom   = searchParams.get('dateFrom');
    const dateTo     = searchParams.get('dateTo');
    const page       = parseInt(searchParams.get('page') || '1', 10);
    const limit      = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip       = (page - 1) * limit;

    const where: AuditLogQueryWhere = {
      tenantId,
      entityType: 'FINANCIAL_REPORT',
    };

    if (reportType && reportType !== 'ALL') {
      where.entityId = reportType;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const prisma = ctx.prisma as unknown as PrismaClient;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          route: true,
          ipAddress: true,
          createdAt: true,
          metadata: true,
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            }
          }
        }
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format response to ensure backward compatibility and no secret leakage
    const formattedData = (logs as unknown as AuditLogRaw[]).map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId, // contains report type e.g. INCOME_STATEMENT
      route: l.route,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
      metadata: l.metadata,
      userId: l.userId,
      userName: l.user?.fullName || l.user?.username || `User #${l.userId}`,
    }));

    return NextResponse.json({
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.error('GET /api/accounting/financial-report-audit failed', { error: errorMsg });
    return NextResponse.json({ error: 'Internal Server Error', details: errorMsg }, { status: 500 });
  }
}

export const GET = withRoute(async (ctx) => _GET(ctx.req as unknown as NextRequest, ctx), { rateLimit: 'DEFAULT' });
