import { NextRequest, NextResponse } from 'next/server';
import { VendorStatementEngine } from '@/lib/vendor-statement';
import { emailQueue } from '@/lib/queue';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const vendorId = parseInt((await params).id);
        const body = await req.json();
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
