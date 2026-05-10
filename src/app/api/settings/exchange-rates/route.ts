import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.exchange-rates' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const rates = await prisma.exchangeRate.findMany({
            take: 100,
            orderBy: { date: 'desc' },
            include: { currency: true }
        });
        return NextResponse.json(rates);
    } catch (error: any) {
        log.error("GET exchange rates error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  currencyId: z.union([z.string(), z.number()]).optional(),
  rate: z.number().optional(),
  date: z.string().optional(),
  updateCurrency: z.string().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const newRate = await prisma.exchangeRate.create({
            data: {
                currencyId: parseInt(data.currencyId),
                rate: parseFloat(data.rate),
                date: data.date ? new Date(data.date) : new Date(),
            }
        });
        
        // Also update the current exchange rate in the Currency table
        if (data.updateCurrency) {
            await prisma.currency.update({
                where: { id: parseInt(data.currencyId) },
                data: { exchangeRate: parseFloat(data.rate) }
            });
        }
        
        return NextResponse.json(newRate);
    } catch (error: any) {
        log.error("POST exchange rate error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
