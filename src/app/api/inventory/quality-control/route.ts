import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'inventory.quality-control' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(req as any);
        // Get PENDING inspections
        const pending = await prisma.qualityInspection.findMany({ take: 100,
            where: { status: 'PENDING', tenantId },
            orderBy: { createdAt: 'desc' }
        });

        // Get recent completed
        const completed = await prisma.qualityInspection.findMany({
            where: { status: { in: ['PASSED', 'FAILED', 'REWORK'] }, tenantId },
            orderBy: { updatedAt: 'desc' },
            take: 20
        });

        return NextResponse.json({ pending, completed });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { id, status, notes } = body;

        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(req as any);
        const inspectionRecord = await prisma.qualityInspection.findFirst({ where: { id, tenantId } });
        if (!inspectionRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.qualityInspection.updateMany({
            where: { id, tenantId },
            data: {
                status,
                notes,
                inspectorId: auth.userId
            }
        });

        // Depending on status, trigger CAPA/NCR or move stock
        if (status === 'FAILED') {
            // Log logic for NCR (Non-Conformance Report)
            log.info('NCR Triggered for', inspectionRecord.referenceNumber);
        }

        return NextResponse.json({ message: 'Inspection updated' });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
