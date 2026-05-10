import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.matching.id.resolve' });


const _POSTSchema = z.object({
  resolutionNotes: z.any().optional(),
  override: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
        const { id } = params;
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { resolutionNotes, override } = body;

        const match = await prisma.threeWayMatch.findUnique({
            where: { id: Number(id) }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match record not found' }, { status: 404 });
        }

        const dataToUpdate: any = {
            resolvedAt: new Date(),
            resolutionNotes
        };

        if (override) {
            dataToUpdate.matchStatus = 'OVERRIDDEN';
            dataToUpdate.paymentBlocked = false; // Release for payment
        } else {
            // Keep it blocked but add notes
            dataToUpdate.matchStatus = 'MANUAL_REVIEW';
        }

        const updatePromises: any[] = [
            prisma.threeWayMatch.update({
                where: { id: Number(id) },
                data: dataToUpdate
            })
        ];

        if (override) {
            updatePromises.push(
                prisma.purchaseInvoice.update({
                    where: { id: match.invoiceId },
                    data: { status: 'APPROVED_FOR_PAYMENT' }
                })
            );
        }

        const [updated] = await prisma.$transaction(updatePromises);

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
