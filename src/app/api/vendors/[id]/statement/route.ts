import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { VendorStatementEngine } from '@/lib/vendor-statement';
import { emailQueue } from '@/lib/queue';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vendors.id.statement' });


const _POSTSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  format: z.any().optional(),
  sendEmail: z.string().email().optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const vendorId = parseInt((await params).id);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fromDate, toDate, format, sendEmail } = body;

        const statement = await VendorStatementEngine.generateStatement(
            vendorId,
            new Date(fromDate),
            new Date(toDate)
        );

        if (sendEmail) {
            await emailQueue.add('send-statement', {
                to: 'vendor@example.com', 
                subject: `Statement of Account - ${statement.vendor.name}`,
                body: `Dear ${statement.vendor.name},\nPlease find your statement attached. Opening Balance: ${statement.openingBalance}, Closing Balance: ${statement.closingBalance}.`
            });
        }

        if (format === 'PDF' || format === 'EXCEL') {
            return NextResponse.json({ ...statement, formatRequested: format });
        }

        return NextResponse.json(statement);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
