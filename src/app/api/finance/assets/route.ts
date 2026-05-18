import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.assets' });

async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as Request);

    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const assets = await prisma.fixedAsset.findMany({ take: 100,
            where: { tenantId: auth.tenantId },
            orderBy: { id: 'desc' },
        });

        return NextResponse.json(assets);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error', details: (e as Error).message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  assetName: z.any().optional(),
  acquisitionCost: z.number().optional(),
  purchaseCost: z.number().optional(),
  purchaseDate: z.string().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as Request);

    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const name = body.name || body.assetName;
        const acquisitionCost = parseFloat(body.acquisitionCost ?? body.purchaseCost ?? '0');
        if (!name || !acquisitionCost) {
            return NextResponse.json({ error: 'name and acquisitionCost are required' }, { status: 400 });
        }

        const { getNextNumber } = require('@/lib/numbering');
        const seqResult = await getNextNumber(prisma, 'FA', undefined);
        const acquisitionDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();

        const asset = await prisma.fixedAsset.create({
            // @ts-expect-error [TS2322] Type assignment mismatch - pending strict types
            data: {
                tenantId: auth.tenantId,
                assetNumber: seqResult.formatted,
                name,
                acquisitionDate,
                acquisitionCost,
                salvageValue: parseFloat(body.salvageValue ?? '0'),
                usefulLifeYears: parseInt(body.usefulLifeYears ?? '1'),
                currentBookValue: acquisitionCost,
                depreciationMethod: body.depreciationMethod || 'STRAIGHT_LINE',
                depreciationStartDate: body.depreciationStartDate ? new Date(body.depreciationStartDate) : acquisitionDate,
                locationId: body.locationId || null,
                status: 'ACTIVE',
            },
        });

        return NextResponse.json(asset);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: (e as Error).message || 'Server Error' }, { status: 400 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
