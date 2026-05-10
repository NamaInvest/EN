import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'enterprise.quality' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const inspections = await prisma.qualityInspection.findMany({
            take: 100,
            orderBy: { inspectionDate: 'desc' }
        });
        
        // Map to what UI expects
        const formatted = inspections.map(i => ({
            id: i.id,
            referenceNumber: i.referenceNumber,
            batchNumber: i.referenceNumber, // Use referenceNumber as batchNumber
            inspector: `Inspector #${i.inspectorId}`, // Mock name
            inspectionDate: i.inspectionDate,
            result: i.status === 'PASSED' ? 'PASS' : 'REJECT',
            notes: i.notes
        }));

        return NextResponse.json(formatted);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  batchNumber: z.any().optional(),
  result: z.any().optional(),
  inspector: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const inspection = await prisma.qualityInspection.create({
            data: {
                referenceNumber: data.batchNumber || `QC-${Date.now()}`,
                inspectorId: 1, // hardcode for now
                status: data.result === 'PASS' ? 'PASSED' : 'FAILED',
                notes: `${data.inspector ? 'Inspector: ' + data.inspector + '. ' : ''}${data.notes || ''}`,
                inspectionDate: new Date(),
            }
        });
        return NextResponse.json(inspection);
    } catch (error: any) {
        log.error('QC Creation Error:', error);
        return NextResponse.json({ error: 'Failed to create QC record' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
