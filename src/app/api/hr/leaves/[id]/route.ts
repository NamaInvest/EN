import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Leave Request Actions API
 * POST /api/hr/leaves/[id]/approve — الموافقة على طلب إجازة
 * POST /api/hr/leaves/[id]/reject — رفض طلب إجازة
 */
import { NextResponse } from 'next/server';
import { LeaveEngine } from '@/lib/leave-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { runFinancialTx } from '@/lib/db/transaction';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.leaves.id' });


const _POSTSchema = z.object({
  action: z.any().optional(),
  rejectionReason: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);

    const url = new URL(req.url);
    const requestId = parseInt((await params).id);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, rejectionReason } = body;

        if (action === 'approve') {
            const prisma = getPrisma(req as any);
            await runFinancialTx(prisma, async (tx: any) => {
                const request = await tx.leaveRequest.findUnique({ where: { id: requestId, tenantId } });
                if (!request) throw new Error('طلب الإجازة غير موجود');
                if (request.status !== 'PENDING') throw new Error('الطلب ليس في حالة انتظار');

                await tx.leaveRequest.update({
                    where: { id: requestId, tenantId },
                    data: { status: 'APPROVED', approvedBy: user.userId, approvedAt: new Date() }
                });

                const year = new Date(request.startDate).getFullYear();
                const days = Number(request.days);

                if (request.leaveType === 'ANNUAL') {
                    await tx.leaveBalance.updateMany({
                        where: { employeeId: request.employeeId, leaveType: 'ANNUAL', year, tenantId },
                        data: { used: { increment: days }, pending: { decrement: days } }
                    });
                }
            }, 'LEAVE_APPROVE');
            return NextResponse.json({ success: true, message: 'تم الموافقة على طلب الإجازة' });
        } else if (action === 'reject') {
            if (!rejectionReason) {
                return NextResponse.json({ error: 'يجب ذكر سبب الرفض' }, { status: 400 });
            }
            const prisma = getPrisma(req as any);
            await runFinancialTx(prisma, async (tx: any) => {
                const request = await tx.leaveRequest.findUnique({ where: { id: requestId, tenantId } });
                if (!request) throw new Error('طلب الإجازة غير موجود');
                if (request.status !== 'PENDING') throw new Error('الطلب ليس في حالة انتظار');

                await tx.leaveRequest.update({
                    where: { id: requestId, tenantId },
                    data: { status: 'REJECTED', rejectionReason }
                });

                if (request.leaveType === 'ANNUAL') {
                    const year = new Date(request.startDate).getFullYear();
                    await tx.leaveBalance.updateMany({
                        where: { employeeId: request.employeeId, leaveType: 'ANNUAL', year, tenantId },
                        data: { pending: { decrement: Number(request.days) } }
                    });
                }
            }, 'LEAVE_REJECT');
            return NextResponse.json({ success: true, message: 'تم رفض طلب الإجازة' });
        } else {
            return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'خطأ في معالجة الطلب' }, { status: 400 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
