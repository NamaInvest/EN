import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.pricing' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const lists = await prisma.priceList.findMany({ take: 100,
            include: {
                _count: {
                    select: { rules: true }
                }
            },
            orderBy: { priority: 'desc' }
        });
        return NextResponse.json(lists);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  currency: z.any().optional(),
  validFrom: z.any().optional(),
  validTo: z.any().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  customerCategoryId: z.union([z.string(), z.number()]).optional(),
  channelId: z.union([z.string(), z.number()]).optional(),
  priority: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { name, currency, validFrom, validTo, customerId, customerCategoryId, channelId, priority } = body;

        const newList = await prisma.priceList.create({
            data: {
                name,
                currency: currency || 'SAR',
                validFrom: new Date(validFrom),
                validTo: validTo ? new Date(validTo) : null,
                customerId: customerId ? parseInt(customerId) : null,
                customerCategoryId: customerCategoryId ? parseInt(customerCategoryId) : null,
                channelId: channelId || null,
                priority: parseInt(priority) || 0
            }
        });
        return NextResponse.json(newList);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// Force TS re-evaluation

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
