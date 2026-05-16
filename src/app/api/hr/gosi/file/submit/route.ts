// @ts-nocheck
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { GOSIEngine } from '@/lib/gosi-engine';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.gosi.file.submit' });

const _POSTSchema = z.object({
  fileId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fileId } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: 'Missing fileId' },
                { status: 400 }
            );
        }

        const user = await getUserFromRequest(request as any);
        const userId = (user as any)?.id || (user as any)?.userId || 1; // fallback for demo

        await GOSIEngine.submitToGOSI(fileId, userId);

        return NextResponse.json({
            message: 'GOSI file submitted and journal entry created successfully',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
