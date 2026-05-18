import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.permissions.fields' });

async function _GET(req: Request) {
    const { getUserFromRequest } = require('@/lib/auth');
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req as any);
    try {
        const permissions = await prisma.roleFieldPermission.findMany({ take: 100,
            where: { tenantId: user.tenantId },
            orderBy: [{ roleName: 'asc' }, { modelName: 'asc' }, { fieldName: 'asc' }]
        });
        return NextResponse.json(permissions);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  roleName: z.any().optional(),
  modelName: z.any().optional(),
  fieldName: z.any().optional(),
  permission: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    const { getUserFromRequest } = require('@/lib/auth');
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!['admin', 'owner'].includes(user.role)) {
        return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });
    }

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { roleName, modelName, fieldName, permission } = body;

        if (!roleName || !modelName || !fieldName || !permission) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.roleFieldPermission.findFirst({
            where: {
                roleName,
                modelName,
                fieldName,
                tenantId: user.tenantId
            }
        });

        let upserted;
        if (existing) {
            upserted = await prisma.roleFieldPermission.update({
                where: { id: existing.id },
                data: { permission }
            });
        } else {
            upserted = await prisma.roleFieldPermission.create({
                data: { roleName, modelName, fieldName, permission, tenantId: user.tenantId }
            });
        }

        return NextResponse.json(upserted);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
