import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const month = searchParams.get('month');
        const where: Record<string, unknown> = {};
        if (employeeId) where.employeeId = parseInt(employeeId);
        if (month) where.date = month; // format: 2025-03

        const records = await prisma.attendance.findMany({ where, include: { employee: { select: { id: true, name: true, position: true, phone: true } } }, orderBy: { id: 'desc' }, take: 200 });
        return NextResponse.json(records);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  checkIn: z.any().optional(),
  checkOut: z.any().optional(),
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
        const record = await prisma.attendance.create({
            data: {
                employeeId: parseInt(body.employeeId),
                date: body.date || new Date().toISOString().split('T')[0],
                checkIn: body.checkIn || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                checkOut: body.checkOut || null,
                notes: body.notes || null,
            },
            include: { employee: { select: { id: true, name: true, position: true, phone: true } } },
        });
        return NextResponse.json(record, { status: 201 });
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  checkOut: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const record = await prisma.attendance.update({
            where: { id: body.id },
            data: {
                checkOut: body.checkOut || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                notes: body.notes,
            },
        });
        return NextResponse.json(record);
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
