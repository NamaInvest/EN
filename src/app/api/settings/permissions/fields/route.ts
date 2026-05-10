import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.permissions.fields' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const permissions = await prisma.roleFieldPermission.findMany({
            take: 100,
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

        const upserted = await prisma.roleFieldPermission.upsert({
            where: {
                roleName_modelName_fieldName: {
                    roleName,
                    modelName,
                    fieldName
                }
            },
            update: { permission },
            create: { roleName, modelName, fieldName, permission }
        });

        return NextResponse.json(upserted);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
