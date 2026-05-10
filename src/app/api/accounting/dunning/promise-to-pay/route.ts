import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.dunning.promise-to-pay' });


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  openItemIds: z.array(z.any()).optional(),
  amount: z.number().optional(),
  date: z.string().optional(),
  channel: z.any().optional(),
  notes: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { customerId, openItemIds, amount, date, channel, notes, userId } = body;

        const promise = await prisma.promiseToPay.create({
            data: {
                customerId,
                openItemIds,
                promisedAmount: amount,
                promisedDate: new Date(date),
                channel,
                notes,
                recordedByUserId: userId || 'system',
                status: 'ACTIVE'
            }
        });

        // Snooze Dunning for this customer until the day after the promised date
        const snoozeDate = new Date(date);
        snoozeDate.setDate(snoozeDate.getDate() + 1);

        await prisma.customer.update({
            where: { id: customerId },
            data: {
                dunningSnoozeUntil: snoozeDate,
                dunningSnoozeReason: 'Promise to pay active'
            }
        });

        return NextResponse.json(promise);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
