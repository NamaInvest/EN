import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'sales', prisma))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;

        // @ts-ignore
        const targets = await prisma.salesTarget.findMany({
            take: 100,
            where: { year, month },
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
            orderBy: { targetAmount: 'desc' }
        });

        // Compute Actual Achieved from SalesInvoices for this specific month/year
        // In PostgreSQL/MySQL we could do complex groupBys, with Prisma we can aggregate per rep
        // OR better, we find all active sales reps and sum their invoices for this period
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Fetch all sales invoices for this period with a salesRepId
        // @ts-ignore
        const invoices = await prisma.salesInvoice.findMany({
            take: 100,
            where: {
                date: { gte: startDate, lte: endDate },
                status: { not: 'cancelled' },
                salesRepId: { not: null }
            },
            select: { salesRepId: true, total: true }
        });

        // Group by salesRepId
        const actualsMap: Record<number, number> = {};
        invoices.forEach((inv: any) => {
            actualsMap[inv.salesRepId] = (actualsMap[inv.salesRepId] || 0) + inv.total;
        });

        const results = targets.map((t: any) => ({
            ...t,
            actualAmount: actualsMap[t.employeeId] || 0,
            achievementPct: t.targetAmount > 0 ? ((actualsMap[t.employeeId] || 0) / t.targetAmount) * 100 : 0
        }));

        return NextResponse.json({ targets: results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  year: z.union([z.string(), z.number()]).optional(),
  month: z.union([z.string(), z.number()]).optional(),
  targetAmount: z.number().optional(),
}).passthrough();

async function _POST(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'sales', prisma))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        if (!body.employeeId || !body.year || !body.month || !body.targetAmount) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const record = await prisma.salesTarget.create({
            data: {
                employeeId: parseInt(body.employeeId),
                year: parseInt(body.year),
                month: parseInt(body.month),
                targetAmount: parseFloat(body.targetAmount)
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
