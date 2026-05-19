/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Qiwa Contracts List API — `/api/hr/qiwa/contracts`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  قائمة عقود قوى مع pagination + filters.
 *
 *  Endpoints:
 *   GET  /api/hr/qiwa/contracts → قائمة العقود (pagination + filter)
 *   POST /api/hr/qiwa/contracts → سجل عقد جديد
 *
 *  أنواع العقود (Qiwa):
 *   - UNLIMITED  : عقد غير محدد المدة
 *   - FIXED      : عقد محدد المدة
 *   - PART_TIME  : عقد دوام جزئي
 *   - SEASONAL   : عقد موسمي
 *   - FLEXIBLE   : عقد مرن
 *
 *  Security:
 *   - RBAC: admin / owner / hr_officer
 *   - Audit log لكل عقد جديد
 *
 *  @see prisma/schema.prisma — QiwaContract
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.qiwa.contracts' });

const ALLOWED_ROLES = ['admin', 'owner', 'hr_officer'] as const;

const CONTRACT_TYPE = z.enum(['UNLIMITED', 'FIXED', 'PART_TIME', 'SEASONAL', 'FLEXIBLE']);
const QIWA_STATUS = z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING']);

/** Schema لقائمة العقود */
const ListQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING', 'ALL']).optional().default('ALL'),
  contractType: CONTRACT_TYPE.optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

/** Schema لإنشاء عقد */
const CreateSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  contractNo: z.string().min(1).max(120),
  contractType: CONTRACT_TYPE,
  qiwaStatus: QIWA_STATUS.optional().default('ACTIVE'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  position: z.string().max(120).optional().nullable(),
  wageAmount: z.coerce.number().min(0).optional().nullable(),
  wageCurrency: z.string().length(3).optional().default('SAR'),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET — قائمة العقود
// ═══════════════════════════════════════════════════════════════════════════

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'معاملات بحث غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { status, contractType, employeeId, page, pageSize } = parsed.data;

  try {
    const where: Record<string, any> = {};
    if (status !== 'ALL') where.qiwaStatus = status;
    if (contractType) where.contractType = contractType;
    if (employeeId) where.employeeId = employeeId;

    const [total, items] = await Promise.all([
      (prisma as any).qiwaContract.count({ where }),
      (prisma as any).qiwaContract.findMany({
        where,
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    log.info('Qiwa contracts listed', {
      requestId,
      userId: auth.userId,
      total,
      filters: { status, contractType, employeeId },
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Qiwa contracts list failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب العقود', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — إنشاء عقد جديد
// ═══════════════════════════════════════════════════════════════════════════

async function handlePost(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات العقد غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const contract = await (prisma as any).qiwaContract.create({
      data: {
        employeeId: data.employeeId,
        contractNo: data.contractNo,
        contractType: data.contractType,
        qiwaStatus: data.qiwaStatus,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        position: data.position ?? null,
        wageAmount: data.wageAmount ?? null,
        wageCurrency: data.wageCurrency,
      },
    });

    await logAuditAction({
      userId: auth.userId,
      action: 'CREATE_QIWA_CONTRACT',
      tableName: 'qiwa_contracts',
      recordId: contract.id,
      details: JSON.stringify({
        employeeId: data.employeeId,
        contractNo: data.contractNo,
        contractType: data.contractType,
      }),
    });

    log.info('Qiwa contract created', {
      requestId,
      userId: auth.userId,
      contractId: contract.id,
      employeeId: data.employeeId,
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (err: any) {
    // P2002: unique constraint violation على contractNo
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'رقم العقد مستخدم مسبقاً' }, { status: 409 });
    }
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Qiwa contract create failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل إنشاء العقد', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});

export const POST = withRoute(handlePost, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
