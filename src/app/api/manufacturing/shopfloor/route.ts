import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'active';

        if (action === 'active') {
            const sessions = await prisma.shopFloorSession.findMany({
            take: 100,
                where: { tenantId, status: { in: ['ACTIVE', 'PAUSED'] } },
                orderBy: { startedAt: 'desc' }
            });
            return NextResponse.json(sessions);
        }

        if (action === 'andon') {
            const calls = await prisma.andonCall.findMany({
            take: 100,
                where: { tenantId, resolvedAt: null },
                orderBy: { calledAt: 'desc' }
            });
            return NextResponse.json(calls);
        }

        return NextResponse.json([]);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const body = await request.json();
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
                await prisma.shopFloorSession.update({
                    where: { id: body.sessionId },
                    data: { status: 'PAUSED', pausedAt: new Date() }
                });
                return NextResponse.json({ success: true, message: 'تم إيقاف العملية مؤقتاً' });
            }

            case 'resume': {
                await prisma.shopFloorSession.update({
                    where: { id: body.sessionId },
                    data: { status: 'ACTIVE', pausedAt: null }
                });
                return NextResponse.json({ success: true, message: 'تم استئناف العملية' });
            }

            case 'complete': {
                await prisma.shopFloorSession.update({
                    where: { id: body.sessionId },
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
                // TODO: Trigger auto-journal for WIP relief + FG receipt + Scrap loss
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
                await prisma.andonCall.update({
                    where: { id: body.callId },
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
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
