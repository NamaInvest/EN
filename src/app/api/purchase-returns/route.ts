import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { postPurchaseReturn } from '@/lib/auto-journal';
import { purchaseReturnCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'purchase-returns' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const returns = await prisma.purchaseReturn.findMany({
            take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(returns);
    } catch (e: any) { return handleApiError(e); }
}

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        // Zod runtime validation + mass-assignment protection
        const body = purchaseReturnCreateSchema.parse(rawBody);

        const userId = body.userId ? Number(body.userId) : null;
        let branchId = body.branchId ? Number(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const last = await prisma.purchaseReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;
        const subtotal = Number(body.subtotal);
        const taxValue = subtotal * 0.15;
        const total = subtotal + taxValue;

        // Atomic transaction: create return AND treasury entry together
        const ret = await prisma.$transaction(async (tx) => {
            const newReturn = await tx.purchaseReturn.create({
                data: {
                    returnNo,
                    originalInvoiceId: body.originalInvoiceId ? Number(body.originalInvoiceId) : null,
                    supplierId: body.supplierId ? Number(body.supplierId) : null,
                    subtotal, taxValue, total,
                    userId, notes: body.notes || null,
                },
            });

            if (n(newReturn.total) > 0) {
                await tx.treasury.create({
                    data: {
                        type: 'in', amount: newReturn.total,
                        description: `مرتجع مشتريات #${returnNo}`,
                        referenceType: 'purchase_return', referenceId: newReturn.id,
                        userId, branchId,
                    }
                });
            }

            return newReturn;
        });

        try {
            await postPurchaseReturn({
                returnNo: ret.returnNo,
                subtotal: n(ret.subtotal),
                taxValue: n(ret.taxValue),
                total: n(ret.total),
                paymentType: 'cash',
                userId: ret.userId || undefined,
                branchId: branchId || undefined,
            });
        } catch (je: unknown) {
            log.warn('Auto Journal skipped (Purchase Return):', je);
        }

        return NextResponse.json(ret, { status: 201 });
    } catch (e: any) { return handleApiError(e); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
