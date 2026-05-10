import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'admin.prompts' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const prompts = await prisma.promptTemplate.findMany({
            take: 100,
            orderBy: [{ key: 'asc' }, { version: 'desc' }]
        });
        
        return NextResponse.json(prompts);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  key: z.any().optional(),
  tenantId: z.union([z.string(), z.number()]).optional(),
  systemPrompt: z.any().optional(),
  userTemplate: z.any().optional(),
  modelHint: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        // Find latest version
        const latest = await prisma.promptTemplate.findFirst({
            where: { key: data.key, tenantId: data.tenantId || null },
            orderBy: { version: 'desc' }
        });

        const newVersion = (latest?.version || 0) + 1;

        const newPrompt = await prisma.promptTemplate.create({
            data: {
                key: data.key,
                tenantId: data.tenantId || null,
                version: newVersion,
                systemPrompt: data.systemPrompt,
                userTemplate: data.userTemplate,
                modelHint: data.modelHint || 'gemini-2.5-flash',
                createdBy: auth.userId.toString()
            }
        });

        return NextResponse.json(newPrompt);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'ADMIN' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'ADMIN' });
