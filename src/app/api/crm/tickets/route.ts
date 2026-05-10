import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'crm.tickets' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await (prisma as any).supportTicket.findMany({
      where,
      include: { sla: true, comments: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error: any) {
    log.error('src/app/api/crm/tickets/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error fetching tickets', { context: 'crm/tickets' });
  }
}


const _POSTSchema = z.object({
  slaId: z.union([z.string(), z.number()]).optional(),
  priority: z.any().optional(),
  dueDate: z.string().optional(),
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
    const last = await (prisma as any).supportTicket.findFirst({ orderBy: { id: 'desc' } });
    const nextNo = `TKT-${String((last?.id || 0) + 1).padStart(5, '0')}`;

    let slaId = data.slaId || null;
    if (!slaId && data.priority) {
      const sla = await (prisma as any).slaPolicy.findFirst({ where: { priority: data.priority, active: true } });
      if (sla) slaId = sla.id;
    }

    let dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (!dueDate && slaId) {
      const sla = await (prisma as any).slaPolicy.findFirst({ where: { id: slaId } });
      if (sla) {
        dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + sla.resolutionHours);
      }
    }

    const ticket = await (prisma as any).supportTicket.create({
      data: {
        ticketNo: nextNo,
        customerId: data.customerId ? parseInt(data.customerId) : null,
        subject: data.subject,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        category: data.category || null,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        slaId,
        dueDate
      }
    });
    return NextResponse.json(ticket);
  } catch (error: any) {
    log.error('src/app/api/crm/tickets/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error creating ticket', { context: 'crm/tickets' });
  }
}


const _PUTSchema = z.object({
  status: z.any().optional(),
  priority: z.any().optional(),
  assignedTo: z.any().optional(),
  satisfaction: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo ? parseInt(data.assignedTo) : null;
    if (data.satisfaction) updateData.satisfaction = parseInt(data.satisfaction);

    if (data.status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (data.status === 'CLOSED') updateData.closedAt = new Date();
    if (data.status === 'IN_PROGRESS') {
      const existing = await (prisma as any).supportTicket.findUnique({ where: { id: parseInt(data.id) } });
      if (existing && !existing.firstResponseAt) updateData.firstResponseAt = new Date();
    }

    const ticket = await (prisma as any).supportTicket.update({
      where: { id: parseInt(data.id) },
      data: updateData
    });
    return NextResponse.json(ticket);
  } catch (error: any) {
    log.error('src/app/api/crm/tickets/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, 'Error updating ticket', { context: 'crm/tickets' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
