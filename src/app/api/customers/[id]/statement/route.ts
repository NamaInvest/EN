import { NextRequest, NextResponse } from 'next/server';
import { CustomerStatementEngine } from '@/lib/customer-statement';
import { emailQueue } from '@/lib/queue';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    try {
        const customerId = parseInt((await params).id);
        const body = await req.json();
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
