import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.letters-of-credit' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        // @ts-ignore - Prisma Language Server sync lock
        const lcs = await prisma.letterOfCredit.findMany({
            take: 100,
            include: { bank: true, supplier: true, currency: true },
            orderBy: { id: 'desc' }
        });
        
        return NextResponse.json(lcs);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل في جلب الاعتمادات المستندية' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
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
}).passthrough();

async function _POST(request: Request) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        // @ts-ignore - Prisma Language Server sync lock
        const lc = await prisma.letterOfCredit.create({
            data: {
                lcNumber: body.lcNumber,
                bankId: parseInt(body.bankId),
                supplierId: parseInt(body.supplierId),
                amount: parseFloat(body.amount),
                currencyId: parseInt(body.currencyId),
                exchangeRate: parseFloat(body.exchangeRate || 1.0),
                openDate: new Date(body.openDate || Date.now()),
                expiryDate: new Date(body.expiryDate),
                status: body.status || 'draft',
                marginPercent: parseFloat(body.marginPercent || 0),
                marginPaid: parseFloat(body.marginPaid || 0),
                portOfLoading: body.portOfLoading || null,
                portOfDischarge: body.portOfDischarge || null,
                notes: body.notes || null,
            },
            include: { bank: true, supplier: true, currency: true }
        });
        
        return NextResponse.json(lc, { status: 201 });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل في إنشاء الاعتماد المستندي' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
