/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Qiwa Dashboard API — `/api/hr/qiwa`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  قوى = منصة وزارة الموارد البشرية لتوثيق عقود العمل + تتبع القوى العاملة.
 *
 *  Endpoint:
 *   GET /api/hr/qiwa → dashboard summary
 *     - عدد العقود حسب الحالة (ACTIVE/EXPIRED/TERMINATED/PENDING)
 *     - عدد العقود المنتهية الصلاحية قريباً (< 30 يوم)
 *     - عدد الموظفين بدون عقد مسجل
 *     - آخر مزامنة مع قوى
 *
 *  Security:
 *   - RBAC: admin / owner / hr_officer / compliance_officer
 *
 *  المرجع القانوني: قرار وزير الموارد البشرية رقم 121130/1441 — توثيق العقود إلزامي
 *
 *  @see prisma/schema.prisma — QiwaContract
 *  @see src/lib/qiwa-engine.ts — syncWorkforce, getEmployeeContracts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.qiwa.dashboard' });

const ALLOWED_ROLES = ['admin', 'owner', 'hr_officer', 'compliance_officer'] as const;

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, auth, requestId } = ctx;
  const startedAt = Date.now();

  try {
    const now = new Date();
    const in30days = new Date(now.getTime() + 30 * 86400 * 1000);

    // كل الاستعلامات بالتوازي
    const [
      totalContracts,
      activeCount,
      expiredCount,
      terminatedCount,
      pendingCount,
      expiringSoon,
      employeesTotal,
      employeesWithContract,
    ] = await Promise.all([
      (prisma as any).qiwaContract.count(),
      (prisma as any).qiwaContract.count({ where: { qiwaStatus: 'ACTIVE' } }),
      (prisma as any).qiwaContract.count({ where: { qiwaStatus: 'EXPIRED' } }),
      (prisma as any).qiwaContract.count({ where: { qiwaStatus: 'TERMINATED' } }),
      (prisma as any).qiwaContract.count({ where: { qiwaStatus: 'PENDING' } }),
      (prisma as any).qiwaContract.findMany({
        where: {
          qiwaStatus: 'ACTIVE',
          endDate: { gte: now, lte: in30days },
        },
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { endDate: 'asc' },
        take: 50,
      }),
      (prisma as any).employee.count({ where: { active: true } }).catch(() => 0),
      (prisma as any).qiwaContract.findMany({
        where: { qiwaStatus: 'ACTIVE' },
        select: { employeeId: true },
        distinct: ['employeeId'],
      }).then((rows: any[]) => rows.length).catch(() => 0),
    ]);

    // أحدث contract sync
    let lastSyncAt: string | null = null;
    try {
      const latest = await (prisma as any).qiwaContract.findFirst({
        where: { syncedAt: { not: null } },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true },
      });
      lastSyncAt = latest?.syncedAt?.toISOString() ?? null;
    } catch { /* ignore */ }

    const employeesWithoutContract = Math.max(0, employeesTotal - employeesWithContract);

    log.info('Qiwa dashboard fetched', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      total: totalContracts,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      summary: {
        totalContracts,
        active: activeCount,
        expired: expiredCount,
        terminated: terminatedCount,
        pending: pendingCount,
        expiringSoonCount: expiringSoon.length,
      },
      employees: {
        total: employeesTotal,
        withActiveContract: employeesWithContract,
        withoutContract: employeesWithoutContract,
      },
      expiringSoon: expiringSoon.map((c: any) => ({
        contractId: c.id,
        contractNo: c.contractNo,
        contractType: c.contractType,
        endDate: c.endDate?.toISOString?.() ?? null,
        employeeId: c.employee?.id,
        employeeName: c.employee?.name || null,
        daysRemaining: c.endDate
          ? Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
      lastSyncAt,
      alerts: [
        ...(employeesWithoutContract > 0
          ? [{
              type: 'WARNING',
              message: `${employeesWithoutContract} موظف نشط بلا عقد مسجل في قوى`,
              action: 'سجّل عقودهم قبل ${30} يوم لتجنب الغرامات',
              legalRef: 'قرار 121130/1441',
            }]
          : []),
        ...(expiringSoon.length > 0
          ? [{
              type: 'INFO',
              message: `${expiringSoon.length} عقد ينتهي خلال 30 يوم`,
              action: 'راجع التجديد قبل الانتهاء',
            }]
          : []),
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Qiwa dashboard failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب البيانات', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
