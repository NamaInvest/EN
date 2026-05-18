import { requireTenantId } from '@/lib/tenant/tenant-guard';
﻿import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.shopfloor' });
async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = requireTenantId(request as any);
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'active';

        if (action === 'active') {
            const sessions = await prisma.shopFloorSession.findMany({ take: 100,
                where: { tenantId, status: { in: ['ACTIVE', 'PAUSED'] } },
                orderBy: { startedAt: 'desc' }
            });
            return NextResponse.json(sessions);
        }

        if (action === 'andon') {
            const calls = await prisma.andonCall.findMany({ take: 100,
                where: { tenantId, resolvedAt: null },
                orderBy: { calledAt: 'desc' }
            });
            return NextResponse.json(calls);
        }

        return NextResponse.json([]);
    } catch (e: any) {
        log.error('shopfloor error', { message: e?.message });
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  workCenterId: z.union([z.string(), z.number()]).optional(),
  manufacturingOrderId: z.union([z.string(), z.number()]).optional(),
  operationId: z.union([z.string(), z.number()]).optional(),
  action: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = requireTenantId(request as any);
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action } = body;

        switch (action) {
            case 'start': {
                const session = await prisma.shopFloorSession.create({
                    data: {
                        tenantId,
                        workCenterId: body.workCenterId,
                        operatorId: auth.userId.toString(),
                        manufacturingOrderId: body.manufacturingOrderId,
                        operationId: body.operationId,
                        startedAt: new Date(),
                        status: 'ACTIVE'
                    }
                });
                return NextResponse.json({ success: true, session });
            }

            case 'pause': {
                await prisma.shopFloorSession.updateMany({
                    where: { id: body.sessionId , tenantId },
                    data: { status: 'PAUSED', pausedAt: new Date() }
                });
                return NextResponse.json({ success: true, message: 'تم إيقاف العملية مؤقتاً' });
            }

            case 'resume': {
                await prisma.shopFloorSession.updateMany({
                    where: { id: body.sessionId , tenantId },
                    data: { status: 'ACTIVE', pausedAt: null }
                });
                return NextResponse.json({ success: true, message: 'تم استئناف العملية' });
            }

            case 'complete': {
                await prisma.shopFloorSession.updateMany({
                    where: { id: body.sessionId , tenantId },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        goodQty: body.goodQty,
                        scrapQty: body.scrapQty || 0,
                        scrapReason: body.scrapReason || null,
                        downtimeMinutes: body.downtimeMinutes || 0,
                        downtimeReason: body.downtimeReason || null
                    }
                });
                // Auto-journal: WIP relief + FG receipt + Scrap loss
                const goodQty  = Number(body.goodQty  || 0);
                const scrapQty = Number(body.scrapQty || 0);
                if ((goodQty + scrapQty) > 0) {
                    const sessionData = await (prisma as any).shopFloorSession.findFirst({ where: { id: body.sessionId , tenantId }, include: { manufacturingOrder: true } }).catch(() => null);
                    const unitCost = Number((sessionData as any)?.manufacturingOrder?.unitCost || 0);
                    const fgCost = goodQty * unitCost;
                    const scrapCost = scrapQty * unitCost;
                    if ((fgCost + scrapCost) > 0) {
                        await (prisma as any).journalEntry.create({ data: { tenantId, reference: `SFS-${body.sessionId}`, description: `WIP Relief`, date: new Date(), status: 'POSTED', postedById: auth.userId.toString(), lines: { create: [ ...(fgCost > 0 ? [{ accountCode: '1330', debit: fgCost, credit: 0, description: 'FG' }] : []), ...(scrapCost > 0 ? [{ accountCode: '7700', debit: scrapCost, credit: 0, description: 'Scrap' }] : []), { accountCode: '1320', debit: 0, credit: fgCost + scrapCost, description: 'WIP' }] } } }).catch(() => {});
                    }
                }
                log.info('shopfloor complete', { sessionId: body.sessionId });
                return NextResponse.json({ success: true, message: 'تم إنهاء العملية بنجاح' });
            }

            case 'andon': {
                const call = await prisma.andonCall.create({
                    data: {
                        tenantId,
                        workCenterId: body.workCenterId,
                        callType: body.callType,
                        calledBy: auth.userId.toString(),
                        calledAt: new Date()
                    }
                });
                return NextResponse.json({ success: true, call, message: 'تم إرسال إنذار Andon!' });
            }

            case 'andon-resolve': {
                await prisma.andonCall.updateMany({
                    where: { id: body.callId , tenantId },
                    data: {
                        respondedBy: auth.userId.toString(),
                        respondedAt: new Date(),
                        resolvedAt: new Date(),
                        resolutionNote: body.note || ''
                    }
                });
                return NextResponse.json({ success: true, message: 'تم حل الإنذار' });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (e: any) {
        log.error('shopfloor error', { message: e?.message });
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
