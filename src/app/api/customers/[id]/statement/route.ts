import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { CustomerStatementEngine } from '@/lib/customer-statement';
import { emailQueue } from '@/lib/queue';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customers.id.statement' });


const _POSTSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  format: z.any().optional(),
  sendEmail: z.string().email().optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const customerId = parseInt((await params).id);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fromDate, toDate, format, sendEmail } = body;

        const statement = await CustomerStatementEngine.generateStatement(
            customerId,
            new Date(fromDate),
            new Date(toDate)
        );

        if (sendEmail) {
            // Find customer email
            // Simplified logic: push to queue
            await emailQueue.add('send-statement', {
                to: 'customer@example.com', // In reality, fetch from customer record
                subject: `Statement of Account - ${statement.customer.name}`,
                body: `Dear ${statement.customer.name},\nPlease find your statement attached. Opening Balance: ${statement.openingBalance}, Closing Balance: ${statement.closingBalance}.`
                // Attachments logic would go here
            });
        }

        if (format === 'PDF' || format === 'EXCEL') {
            // Placeholder: usually generate PDF using jspdf or puppeteer here.
            // Returning JSON for now as frontend will render it.
            return NextResponse.json({ ...statement, formatRequested: format });
        }

        return NextResponse.json(statement);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
