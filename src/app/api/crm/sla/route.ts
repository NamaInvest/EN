import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'crm.sla' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).slaPolicy.findMany({ take: 100,
      orderBy: { priority: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    log.error('src/app/api/crm/sla/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error', { context: 'crm/sla' });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  priority: z.any().optional(),
  responseHours: z.any().optional(),
  resolutionHours: z.any().optional(),
  escalationHours: z.any().optional(),
  active: z.boolean().optional(),
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
    const item = await (prisma as any).slaPolicy.create({
      data: {
        name: data.name,
        priority: data.priority || 'MEDIUM',
        responseHours: parseInt(data.responseHours) || 4,
        resolutionHours: parseInt(data.resolutionHours) || 24,
        escalationHours: data.escalationHours ? parseInt(data.escalationHours) : null,
        active: data.active !== false
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    log.error('src/app/api/crm/sla/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error', { context: 'crm/sla' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  priority: z.any().optional(),
  responseHours: z.any().optional(),
  resolutionHours: z.any().optional(),
  escalationHours: z.any().optional(),
  active: z.boolean().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).slaPolicy.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        priority: data.priority,
        responseHours: data.responseHours ? parseInt(data.responseHours) : undefined,
        resolutionHours: data.resolutionHours ? parseInt(data.resolutionHours) : undefined,
        escalationHours: data.escalationHours ? parseInt(data.escalationHours) : undefined,
        active: data.active
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    log.error('src/app/api/crm/sla/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error', { context: 'crm/sla' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
