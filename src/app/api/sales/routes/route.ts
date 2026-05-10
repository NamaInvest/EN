import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.routes' });

async function _GET(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        // Assume sales module permissions
        if (!(await hasPermission(auth.userId, 'sales', prisma))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        // @ts-ignore
        const routes = await prisma.route.findMany({ take: 100,
            include: {
                salesRep: true,
                _count: { select: { customers: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(routes);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  description: z.any().optional(),
  salesRepId: z.union([z.string(), z.number()]).optional(),
  active: z.boolean().optional(),
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
        
        if (!body.name) {
             return NextResponse.json({ error: 'اسم خط السير مطلوب' }, { status: 400 });
        }

        // @ts-ignore
        const record = await prisma.route.create({
            data: {
                name: body.name,
                description: body.description,
                salesRepId: body.salesRepId ? parseInt(body.salesRepId) : null,
                active: body.active !== undefined ? body.active : true
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
