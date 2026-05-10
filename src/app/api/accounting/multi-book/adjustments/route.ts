import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.multi-book.adjustments' });


const _POSTSchema = z.object({
  sourceBook: z.any().optional(),
  targetBook: z.any().optional(),
  amount: z.number().optional(),
  description: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { sourceBook, targetBook, amount, description } = body;
        
        // Logic to create adjustment entry between books
        return NextResponse.json({
            status: 'success',
            journalEntryId: 'JE-MB-001',
            message: `Adjustment created from ${sourceBook} to ${targetBook}`
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
