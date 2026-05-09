import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Priority 9: Supplier Contracts API
 * GET  /api/procurement/supplier-contracts
 * POST /api/procurement/supplier-contracts
 * GET  /api/procurement/supplier-contracts?expiringSoon=true — عقود تنتهي خلال 30 يوم
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const expiringSoon = url.searchParams.get('expiringSoon') === 'true';
    const supplierId   = url.searchParams.get('supplierId');

    try {
        const where: any = {};

        if (supplierId) where.supplierId = parseInt(supplierId);

        if (expiringSoon) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            where.endDate = { lte: thirtyDaysFromNow };
            where.status = 'active';
        }

        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const contracts = await prisma.supplierContract.findMany({
            take: 100,
            where,
            include: {
                supplier: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { endDate: 'asc' },
        });

        // Enrich with days remaining
        const enriched = contracts.map((c: any) => ({
            ...c,
            daysRemaining: Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        }));

        return NextResponse.json({
            total: enriched.length,
            contracts: enriched,
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في تحميل العقود' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  contractNo: z.any().optional(),
  supplierId: z.union([z.string(), z.number()]).optional(),
  title: z.any().optional(),
  description: z.any().optional(),
  startDate: z.string().optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        // Auto-generate contract number
        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const last = await prisma.supplierContract.findFirst({ orderBy: { id: 'desc' } });
        const contractNo = `SC-${new Date().getFullYear()}-${String((last?.id || 0) + 1).padStart(4, '0')}`;

        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const contract = await prisma.supplierContract.create({
            data: {
                contractNo:      body.contractNo || contractNo,
                supplierId:      parseInt(body.supplierId),
                title:           body.title,
                description:     body.description || null,
                startDate:       new Date(body.startDate),
                endDate:         new Date(body.endDate),
                value:           parseFloat(body.value) || 0,
                currency:        body.currency || 'SAR',
                paymentTerms:    body.paymentTerms || null,
                status:          'active',
                autoRenew:       body.autoRenew || false,
                alertDaysBefore: parseInt(body.alertDaysBefore) || 30,
                notes:           body.notes || null,
            },
            include: {
                supplier: { select: { name: true } },
            },
        });

        return NextResponse.json(contract, { status: 201 });
    } catch (e: any) {
        console.error('Supplier contract create error:', e);
        return NextResponse.json({ error: 'خطأ في إنشاء العقد' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
