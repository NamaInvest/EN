import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { reportInvoice } from '@/lib/zatca-fatoora';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Read ZATCA credentials from env — must be set per-tenant in production
    const binarySecurityToken = process.env.ZATCA_BINARY_SECURITY_TOKEN;
    const zatcaSecret         = process.env.ZATCA_SECRET;
    const zatcaEnv            = (process.env.ZATCA_ENV || 'simulation') as 'simulation' | 'production';

    if (!binarySecurityToken || !zatcaSecret) {
        return NextResponse.json(
            { error: 'ZATCA credentials not configured (set ZATCA_BINARY_SECURITY_TOKEN and ZATCA_SECRET in .env)' },
            { status: 500 }
        );
    }

    const prisma = getPrisma(request);

    try {
        const pendingRecords = await prisma.zATCARecord.findMany({
            where: { status: 'pending' },
            take: 10,
        });

        if (pendingRecords.length === 0) {
            return NextResponse.json({ message: 'No pending ZATCA records found' });
        }

        const results = [];

        for (const record of pendingRecords) {
            try {
                const zatcaResponse = await reportInvoice({
                    binarySecurityToken,
                    secret: zatcaSecret,
                    invoiceHash: record.zatcaHash || '',
                    uuid: record.id.toString(),
                    invoiceBase64: Buffer.from(record.zatcaXml || '').toString('base64'),
                    environment: zatcaEnv,
                });

                // ZatcaInvoiceResponse.status = 'PASS' | 'WARNING' | 'ERROR'
                const passed = zatcaResponse.status === 'PASS' || zatcaResponse.status === 'WARNING';

                await prisma.zATCARecord.update({
                    where: { id: record.id },
                    data: {
                        status: passed ? 'sent' : 'failed',
                        zatcaResponse: JSON.stringify(zatcaResponse),
                    },
                });

                const errorSummary = zatcaResponse.errors?.map(e => `${e.code}: ${e.message}`).join(', ');
                results.push({ id: record.id, status: passed ? 'success' : 'failed', error: errorSummary });
            } catch (err: any) {
                await prisma.zATCARecord.update({
                    where: { id: record.id },
                    data: { status: 'failed', zatcaResponse: err.message },
                });
                results.push({ id: record.id, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });
    } catch (error: any) {
        console.error('ZATCA Cron Error:', error);
        return NextResponse.json({ error: 'Failed to process ZATCA records' }, { status: 500 });
    }
}

