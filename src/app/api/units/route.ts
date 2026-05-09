import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

// GET all units
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const units = await prisma.unit.findMany({
            take: 100, orderBy: { name: 'asc' } });
        return NextResponse.json(units);
    } catch (error: any) {
        console.error('Units GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST create new unit name

const _POSTSchema = z.object({
  name: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (!body.name?.trim()) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
        const unit = await prisma.unit.create({ data: { name: body.name.trim() } });
        return NextResponse.json(unit, { status: 201 });
    } catch (error: any) {
        console.error('Unit POST error:', error);
        return NextResponse.json({ error: 'فشل في الإضافة' }, { status: 500 });
    }
}

// DELETE a unit by id
async function _DELETE(request: NextRequest) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const id = parseInt(searchParams.get('id') || '');
        if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
        await prisma.unit.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Unit DELETE error:', error);
        return NextResponse.json({ error: 'فشل في الحذف' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
