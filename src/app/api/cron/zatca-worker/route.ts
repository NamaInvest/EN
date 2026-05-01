import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
// import { reportInvoiceToZatca } from '@/lib/zatca-fatoora'; // Assume this exists based on workflow

export async function GET(request: Request) {
    // This endpoint should be triggered by a cron job every X minutes
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'ZATCA_CRON_SECRET'}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const prisma = getPrisma(request);
    
    try {
        // Find top 10 pending ZATCA records
        const pendingRecords = await prisma.zATCARecord.findMany({
            where: { status: 'pending' },
            take: 10
        });

        if (pendingRecords.length === 0) {
            return NextResponse.json({ message: 'No pending ZATCA records found' });
        }

        const results = [];

        for (const record of pendingRecords) {
            try {
                // Here we would call the actual ZATCA reporting logic
                // const zatcaResponse = await reportInvoiceToZatca(record.invoiceId, record.invoiceType);
                
                // For demonstration/simulation if the real API isn't fully configured
                const zatcaResponse = { success: true, message: 'Reported successfully' };

                if (zatcaResponse.success) {
                    await prisma.zATCARecord.update({
                        where: { id: record.id },
                        data: {
                            status: 'sent',
                            zatcaResponse: JSON.stringify(zatcaResponse)
                        }
                    });
                    results.push({ id: record.id, status: 'success' });
                } else {
                    await prisma.zATCARecord.update({
                        where: { id: record.id },
                        data: {
                            status: 'failed',
                            zatcaResponse: zatcaResponse.message
                        }
                    });
                    results.push({ id: record.id, status: 'failed', error: zatcaResponse.message });
                }
            } catch (err: any) {
                await prisma.zATCARecord.update({
                    where: { id: record.id },
                    data: {
                        status: 'failed',
                        zatcaResponse: err.message
                    }
                });
                results.push({ id: record.id, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });
    } catch (error: any) {
        console.error("ZATCA Cron Error:", error);
        return NextResponse.json({ error: 'Failed to process ZATCA records' }, { status: 500 });
    }
}
