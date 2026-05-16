import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'banks.id' });

const _PUTSchema = z.object({
  branchId: z.union([z.string(), z.number()]).optional(),
  bankName: z.any().optional(),
  accountName: z.any().optional(),
  accountNumber: z.any().optional(),
  iban: z.any().optional(),
  currency: z.any().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const tenantId = requireTenantId(request as any);
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const branchId = body.branchId ? parseInt(body.branchId.toString()) : null;

        const data: any = {};
        if (body.bankName !== undefined) data.bankName = body.bankName;
        if (body.accountName !== undefined) data.accountName = body.accountName;
        if (body.accountNumber !== undefined) data.accountNumber = body.accountNumber;
        if (body.iban !== undefined) data.iban = body.iban;
        if (body.currency !== undefined) data.currency = body.currency;
        if (body.isActive !== undefined) data.isActive = body.isActive;
        if (branchId !== undefined) data.branchId = branchId;

        const bank = await prisma.bankAccount.update({
            where: { id, tenantId },
            data
        });

        return NextResponse.json(bank);
    } catch (error: any) { 
        log.error(error); 
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'banks/[id]' }); 
    }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const tenantId = requireTenantId(request as any);
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        // Check if there are transactions other than opening balance
        const transactionsCount = await prisma.bankTransaction.count({
            where: { bankAccountId: id, tenantId }
        });

        if (transactionsCount > 1) {
            return NextResponse.json({ error: 'لا يمكن حذف الحساب البنكي لوجود حركات مالية عليه' }, { status: 400 });
        }

        // Delete opening balance transaction if it exists
        await prisma.bankTransaction.deleteMany({
            where: { bankAccountId: id, tenantId }
        });

        await prisma.bankAccount.delete({
            where: { id, tenantId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) { 
        log.error(error); 
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'banks/[id]' }); 
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
