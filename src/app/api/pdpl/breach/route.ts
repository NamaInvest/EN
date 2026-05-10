import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * PDPL Breach Incident API
 * GET  /api/pdpl/breach — Get active breaches
 * POST /api/pdpl/breach — Record new breach
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { recordBreach, getActiveBreaches } from '@/lib/pdpl-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pdpl.breach' });

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const breaches = await getActiveBreaches(prisma);
        return NextResponse.json(breaches);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  category: z.any().optional(),
  severity: z.any().optional(),
  affectedRecords: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (!body.category || !body.severity || body.affectedRecords === undefined) {
            return NextResponse.json({ error: 'مطلوب: category, severity, affectedRecords' }, { status: 400 });
        }
        const breach = await recordBreach(prisma, {
            ...body,
            ownerUserId: (user as any).id,
        });
        return NextResponse.json(breach, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
