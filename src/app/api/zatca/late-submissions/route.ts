import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ZATCACounterService } from '@/lib/zatca-counter-service';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find Simplified Tax Invoices (B2C) that are NOT cleared and older than 24 hours
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const lateInvoices = await prisma.salesInvoice.findMany({
      where: {
        cleared: false,
        docType: 'invoice', // We target standard or simplified invoices
        date: { lt: thresholdDate },
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        date: true,
        invoiceNo: true,
      }
    });

    if (lateInvoices.length === 0) {
      return NextResponse.json({ status: 'success', message: 'No late submissions found.' });
    }

    const processed: number[] = [];
    const failed: any[] = [];

    // In a real scenario, this would bulk-report them to ZATCA Core API
    for (const inv of lateInvoices) {
      try {
        // Mock ZATCA Reporting Call
        // const nextIcv = await ZATCACounterService.getNextICV(inv.tenantId);
        // await zatcaCoreAPI.report(inv);
        
        await prisma.salesInvoice.update({
          where: { id: inv.id },
          data: { 
            cleared: true, 
            status: 'REPORTED_LATE' 
          }
        });
        processed.push(inv.invoiceNo);
      } catch (err: any) {
        failed.push({ invoiceNo: inv.invoiceNo, error: err.message });
      }
    }

    return NextResponse.json({
      status: 'success',
      summary: {
        totalLate: lateInvoices.length,
        processedCount: processed.length,
        failedCount: failed.length,
      },
      processed,
      failed
    });

  } catch (error: any) {
    console.error('ZATCA Late Submissions Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
