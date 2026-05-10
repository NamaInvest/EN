import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vacations' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const vacations = await prisma.vacation.findMany({
            take: 100, include: { employee: { select: { id: true, name: true, position: true,  phone: true } } }, orderBy: { id: 'desc' } });
        return NextResponse.json(vacations);
    } catch (e: any) { log.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  type: z.any().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const vacation = await prisma.vacation.create({
            data: {
                employeeId: parseInt(body.employeeId),
                type: body.type || 'annual',
                dateFrom: body.dateFrom, dateTo: body.dateTo,
                status: body.status || 'approved',
                notes: body.notes || null,
            },
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
        });
        return NextResponse.json(vacation, { status: 201 });
    } catch (e: any) { log.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const vacation = await prisma.vacation.update({ where: { id: body.id }, data: { status: body.status, notes: body.notes } });
        return NextResponse.json(vacation);
    } catch (e: any) { log.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
