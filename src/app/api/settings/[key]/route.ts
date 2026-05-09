import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { key } = await params;
        const setting = await prisma.setting.findUnique({ where: { key } });
        return NextResponse.json(setting || { key, value: '' });
    } catch (error: any) { console.error(error); return NextResponse.json({ error: 'خطأ' }, { status: 500 }); }
}


const _PUTSchema = z.object({
  value: z.any().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { key } = await params;
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: body.value },
            create: { key, value: body.value },
        });
        return NextResponse.json(setting);
    } catch (error: any) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });
