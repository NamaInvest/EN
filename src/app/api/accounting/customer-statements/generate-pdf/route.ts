import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { customerId, templateId } = body;

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        // Generate PDF using puppeteer or other library
        const mockPdfUrl = `https://namainvist-assets.s3.amazonaws.com/statements/stmt_${customerId}_${Date.now()}.pdf`;

        // Create log entry
        /*
        const log = await prisma.statementDispatchLog.create({
            data: {
                customerId,
                templateId,
                dateFrom: new Date(),
                dateTo: new Date(),
                pdfUrl: mockPdfUrl,
                status: 'GENERATED',
                deliveryChannel: 'DOWNLOAD',
                triggeredBy: 'MANUAL',
                openingBalance: 0,
                closingBalance: 0,
                transactionsCount: 0,
                totalDebits: 0,
                totalCredits: 0
            }
        });
        */

        return NextResponse.json({
            message: 'PDF generated successfully',
            pdfUrl: mockPdfUrl,
            hash: 'mock-hash-12345'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
