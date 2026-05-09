import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { IFRS9Engine } from '@/lib/ifrs9-ecl';
import { z } from 'zod';


const _POSTSchema = z.object({
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
  asOfDate: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fiscalPeriodId, asOfDate, userId } = body;

        if (!fiscalPeriodId || !asOfDate || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await IFRS9Engine.runPortfolioECL(
            parseInt(fiscalPeriodId),
            new Date(asOfDate),
            userId.toString()
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
