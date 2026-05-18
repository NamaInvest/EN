import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.checks' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type'); // PAYABLE, RECEIVABLE
        
        const conditions: any = { tenantId: auth.tenantId };
        if (type) conditions.type = type;

        // @ts-ignore
        const checks = await prisma.checkTransaction.findMany({ take: 100,
            where: conditions,
            include: {
                customer: true,
                supplier: true,
                bankAccount: true
            },
            orderBy: { dueDate: 'asc' }
        });

        return NextResponse.json(checks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  checkNumber: z.any().optional(),
  amount: z.number().optional(),
  dueDate: z.string().optional(),
  type: z.any().optional(),
  bankName: z.any().optional(),
  notes: z.any().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  supplierId: z.union([z.string(), z.number()]).optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        if (!body.checkNumber || !body.amount || !body.dueDate || !body.type) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const check = await prisma.checkTransaction.create({
            data: {
                tenantId: auth.tenantId,
                type: body.type, // PAYABLE or RECEIVABLE
                checkNumber: body.checkNumber,
                bankName: body.bankName || 'غير محدد',
                dueDate: new Date(body.dueDate),
                amount: parseFloat(body.amount),
                status: 'PENDING',
                notes: body.notes,
                customerId: body.customerId || null,
                supplierId: body.supplierId || null,
                bankAccountId: body.bankAccountId || null
            }
        });

        return NextResponse.json(check, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
