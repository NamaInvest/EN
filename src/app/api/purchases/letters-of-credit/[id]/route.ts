import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.letters-of-credit.id' });


const _PUTSchema = z.object({
  lcNumber: z.any().optional(),
  bankId: z.union([z.string(), z.number()]).optional(),
  supplierId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currencyId: z.union([z.string(), z.number()]).optional(),
  exchangeRate: z.number().optional(),
  openDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.any().optional(),
  marginPercent: z.any().optional(),
  marginPaid: z.union([z.string(), z.number()]).optional(),
  portOfLoading: z.any().optional(),
  p: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const id = parseInt((await params).id);
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const lc = await prisma.letterOfCredit.update({
            where: { id },
            data: {
                lcNumber: body.lcNumber,
                bankId: parseInt(body.bankId),
                supplierId: parseInt(body.supplierId),
                amount: parseFloat(body.amount),
                currencyId: parseInt(body.currencyId),
                exchangeRate: parseFloat(body.exchangeRate || 1.0),
                openDate: new Date(body.openDate),
                expiryDate: new Date(body.expiryDate),
                status: body.status,
                marginPercent: parseFloat(body.marginPercent || 0),
                marginPaid: parseFloat(body.marginPaid || 0),
                portOfLoading: body.portOfLoading,
                portOfDischarge: body.portOfDischarge,
                notes: body.notes,
            },
            include: { bank: true, supplier: true, currency: true }
        });

        return NextResponse.json(lc);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل في تحديث الاعتماد المستندي' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const id = parseInt((await params).id);
        await prisma.letterOfCredit.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل في حذف الاعتماد. قد يكون مرتبطاً بمشتريات.' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'FINANCIAL' });
