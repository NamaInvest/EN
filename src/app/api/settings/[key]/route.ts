import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.key' });
async function _GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { getUserFromRequest } = require('@/lib/auth');
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { key } = await params;
        const setting = await prisma.setting.findFirst({ where: { key, tenantId: user.tenantId } });
        return NextResponse.json(setting || { key, value: '' });
    } catch (error: any) { log.error(error); return NextResponse.json({ error: 'خطأ' }, { status: 500 }); }
}


const _PUTSchema = z.object({
  value: z.any().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!['admin', 'owner'].includes(_auth.role)) {
        return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });
    }

    const prisma = getPrisma(request);
    try {
        const { key } = await params;
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const existing = await prisma.setting.findFirst({
            where: { key, tenantId: _auth.tenantId }
        });
        
        let setting;
        if (existing) {
            setting = await prisma.setting.update({
                where: { id: existing.id },
                data: { value: body.value }
            });
        } else {
            setting = await prisma.setting.create({
                data: { key, value: body.value, tenantId: _auth.tenantId }
            });
        }
        
        return NextResponse.json(setting);
    } catch (error: any) { log.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });
