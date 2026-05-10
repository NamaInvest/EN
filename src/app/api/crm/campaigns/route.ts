import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'crm.campaigns' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const campaigns = await (prisma as any).crmCampaign.findMany({ take: 100,
      where,
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(campaigns);
  } catch (error: any) {
    log.error('src/app/api/crm/campaigns/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error fetching campaigns', { context: 'crm/campaigns' });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  type: z.any().optional(),
  status: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.any().optional(),
  description: z.any().optional(),
  targetCount: z.any().optional(),
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
    const campaign = await (prisma as any).crmCampaign.create({
      data: {
        name: data.name,
        type: data.type || 'EMAIL',
        status: data.status || 'DRAFT',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: parseFloat(data.budget) || 0,
        description: data.description || null,
        targetCount: parseInt(data.targetCount) || 0
      }
    });
    return NextResponse.json(campaign);
  } catch (error: any) {
    log.error('src/app/api/crm/campaigns/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error creating campaign', { context: 'crm/campaigns' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
    if (updateData.targetCount) updateData.targetCount = parseInt(updateData.targetCount);
    
    const campaign = await (prisma as any).crmCampaign.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    return NextResponse.json(campaign);
  } catch (error: any) {
    log.error('src/app/api/crm/campaigns/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error updating campaign', { context: 'crm/campaigns' });
  }
}

async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).crmCampaign.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('src/app/api/crm/campaigns/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error deleting campaign', { context: 'crm/campaigns' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
