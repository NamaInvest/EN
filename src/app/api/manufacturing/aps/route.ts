import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ManufacturingApsService } from '@/lib/services/manufacturing-aps.service';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } from '@/lib/idempotency';
import { runInventoryTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'api.manufacturing.aps' });

const _POSTSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('run'),
    horizonDays: z.coerce.number().optional().default(30),
  }),
  z.object({
    type: z.literal('schedule_op'),
    manufacturingOrderId: z.coerce.number(),
    operationId: z.coerce.number(),
    workCenterId: z.coerce.number(),
    plannedStart: z.coerce.date(),
    plannedEnd: z.coerce.date(),
    sequence: z.coerce.number().optional().default(1),
  }),
]);

async function _POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const prisma = getPrisma(req);

  try {
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    }

    const body = await req.json();

    // Workaround for string dates in JSON getting correctly parsed to Dates by zod
    if (body.plannedStart) body.plannedStart = new Date(body.plannedStart);
    if (body.plannedEnd) body.plannedEnd = new Date(body.plannedEnd);

    const _parsed = _POSTSchema.safeParse(body);
    if (!_parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const payload = _parsed.data;
    log.info('Manufacturing APS API called', { tenantId, type: payload.type });

    const isUnique = await lockIdempotencyKey(tenantId, 'manufacturing_aps', idempotencyKey);
    if (!isUnique) {
      return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    }

    try {
      const result = await runInventoryTx(prisma, async (tx) => {
        if (payload.type === 'run') {
          return await ManufacturingApsService.runSchedule(tx, tenantId, payload.horizonDays);
        } else if (payload.type === 'schedule_op') {
          return await ManufacturingApsService.scheduleOperation(
            tx,
            tenantId,
            payload.manufacturingOrderId,
            payload.operationId,
            payload.workCenterId,
            payload.plannedStart,
            payload.plannedEnd,
            payload.sequence
          );
        }
      });

      await completeIdempotencyKey(tenantId, 'manufacturing_aps', idempotencyKey);
      return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
      await unlockIdempotencyKey(tenantId, 'manufacturing_aps', idempotencyKey);
      log.error('Manufacturing APS Execution Error', { err });
      return NextResponse.json({ error: err.message || 'فشل في العملية' }, { status: 500 });
    }
  } catch (e: any) {
    log.error('Manufacturing APS API Error', { err: e });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function _GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const prisma = getPrisma(req);

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'conflicts';

    if (action === 'conflicts') {
      const workCenterId = Number(searchParams.get('workCenterId') ?? 0);
      if (!workCenterId) {
        return NextResponse.json({ error: 'workCenterId is required' }, { status: 400 });
      }

      // Safe cross-boundary read-only call
      const conflicts = await runInventoryTx(prisma, async (tx) => {
         return await ManufacturingApsService.detectConflicts(tx, tenantId, workCenterId);
      });
      return NextResponse.json({ conflicts });
    }

    if (action === 'dashboard') {
      const dashboard = await runInventoryTx(prisma, async (tx) => {
        return await ManufacturingApsService.getDashboard(tx, tenantId);
      });
      return NextResponse.json(dashboard);
    }

    if (action === 'schedule') {
        const orderId = Number(searchParams.get('manufacturingOrderId') ?? 0);
        if (!orderId) {
          return NextResponse.json({ error: 'manufacturingOrderId is required' }, { status: 400 });
        }
  
        const schedule = await runInventoryTx(prisma, async (tx) => {
           return await ManufacturingApsService.getSchedule(tx, tenantId, orderId);
        });
        return NextResponse.json({ schedule });
      }

    return NextResponse.json({ error: 'Invalid GET action' }, { status: 400 });
  } catch (e: any) {
    log.error('Manufacturing APS GET Error', { err: e });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', tenantRequired: true });
