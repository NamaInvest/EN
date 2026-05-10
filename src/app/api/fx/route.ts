import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * FX Operations API
 * GET  /api/fx/rates — Get exchange rates
 * POST /api/fx/revalue — Run FX revaluation
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'fx' });

const db = (p: any) => p as any;

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const rates = await db(prisma).exchangeRate?.findMany?.({
            orderBy: { effectiveDate: 'desc' },
            take: 50,
        }).catch(() => []) ?? [];
        return NextResponse.json(rates);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
  baseCurrency: z.any().optional(),
  asOfDate: z.string().optional(),
  fromCurrency: z.any().optional(),
  toCurrency: z.any().optional(),
  rate: z.number().optional(),
  toCurrenc: z.any().optional(),
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
        const action = body.action;

        if (action === 'revalue') {
            const { FxRevaluationEngine } = await import('@/lib/fx-revaluation');
            const result = await FxRevaluationEngine.runRevaluation(
                body.fiscalPeriodId || 1,
                body.baseCurrency || 'SAR',
                body.asOfDate ? new Date(body.asOfDate) : new Date(),
                String((user as any).id || 1)
            );
            return NextResponse.json(result);
        }

        // Create/update rate
        if (body.fromCurrency && body.toCurrency && body.rate) {
            const rate = await db(prisma).exchangeRate.create({
                data: {
                    fromCurrency: body.fromCurrency,
                    toCurrency: body.toCurrency,
                    rate: body.rate,
                    effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
                },
            });
            return NextResponse.json(rate, { status: 201 });
        }

        return NextResponse.json({ error: 'مطلوب: action=revalue أو fromCurrency+toCurrency+rate' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
