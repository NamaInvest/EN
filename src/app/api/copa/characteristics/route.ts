/**
 * CO-PA Characteristics CRUD
 * GET  /api/copa/characteristics — List all
 * POST /api/copa/characteristics — Create new
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'copa.characteristics' });

async function _GET(req: NextRequest) {

    try {
        const prisma = await getPrisma(req);
        const items = await prisma.copaCharacteristic.findMany({
            take: 100, orderBy: { id: 'asc' } });
        return NextResponse.json(items);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  code: z.any().optional(),
  name: z.any().optional(),
  type: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const prisma = await getPrisma(req);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        if (!body.code || !body.name || !body.type) {
            return NextResponse.json({ error: 'مطلوب: code, name, type' }, { status: 400 });
        }

        const item = await prisma.copaCharacteristic.create({
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        if (e.code === 'P2002') return NextResponse.json({ error: 'الكود مستخدم مسبقاً' }, { status: 409 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
