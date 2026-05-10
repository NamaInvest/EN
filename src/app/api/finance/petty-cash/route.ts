import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.petty-cash' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury', prisma))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        // @ts-ignore
        const records = await prisma.pettyCashTransaction.findMany({ take: 100,
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
            orderBy: { requestDate: 'desc' }
        });

        return NextResponse.json(records);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  purpose: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury', prisma))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        if (!body.employeeId || !body.amount) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const record = await prisma.pettyCashTransaction.create({
            data: {
                employeeId: parseInt(body.employeeId),
                amount: parseFloat(body.amount),
                purpose: body.purpose || 'عهدة جديدة',
                status: 'PENDING'
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
