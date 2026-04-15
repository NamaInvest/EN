import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode'; // if missing we will just use dummy or skip phase 1 qr generation text

// This endpoint is meant to be called daily (e.g. at 00:01 AM) by a Cron Job
export async function GET(req: NextRequest) {
    try {
        // Find all SalesOrders flagged as Recurring with a due date passing NOW
        const activeContracts = await prisma.salesOrder.findMany({
            where: { status: { startsWith: 'RECURRING_' } },
            include: { details: true, customer: { select: { id: true, name: true, phone: true, email: true, vatNumber: true } } }
        });

        const today = new Date();
        const generatedInvoices = [];

        for (const contract of activeContracts) {
            let meta;
            try { meta = JSON.parse(contract.notes || '{}'); } catch(e) { continue; }
            
            if (!meta.nextBillingDate) continue;
            
            const nextDate = new Date(meta.nextBillingDate);
            
            // If the billing cycle has arrived or passed!
            if (nextDate <= today) {
                console.log(`[CRON] Generating invoice for Contract #${contract.id} - ${contract.customer?.name}`);
                
                // 1. Get max invoice number
                const maxInv = await prisma.salesInvoice.aggregate({ _max: { invoiceNo: true } });
                const nextInvNo = (maxInv._max.invoiceNo || 0) + 1;

                // 2. Create the Sales Invoice natively
                const newInvoice = await prisma.salesInvoice.create({
                    data: {
                        invoiceNo: nextInvNo,
                        date: new Date(),
                        customerId: contract.customerId,
                        stockId: contract.stockId,
                        subtotal: contract.subtotal,
                        taxValue: contract.taxValue,
                        total: contract.total,
                        paid: 0, // Unpaid
                        remaining: contract.total,
                        paymentType: 'credit', // Subscription is usually credit
                        status: 'completed',
                        zatcaStatus: 'pending', // Pending ZATCA clearance/reporting
                        notes: `فاتورة مجدولة تلقائياً لعقد اشتراك رقم #${contract.orderNo}. ${meta.extraNotes || ''}`,
                        userId: contract.userId,
                        details: {
                            create: contract.details.map((d: any) => ({
                                productId: d.productId,
                                productName: d.productName,
                                quantity: d.quantity,
                                price: d.price,
                                total: d.total,
                                taxValue: d.taxValue
                            }))
                        }
                    }
                });

                // 3. Update the Contract's Next Billing Date
                const frequency = meta.frequency || 'MONTHLY';
                let newBillingDate = new Date(nextDate);
                if (frequency === 'MONTHLY') {
                    newBillingDate.setMonth(newBillingDate.getMonth() + 1);
                } else if (frequency === 'YEARLY') {
                    newBillingDate.setFullYear(newBillingDate.getFullYear() + 1);
                } else {
                     newBillingDate.setDate(newBillingDate.getDate() + 7); // Default Weekly fallback
                }

                meta.nextBillingDate = newBillingDate.toISOString();

                await prisma.salesOrder.update({
                    where: { id: contract.id },
                    data: { notes: JSON.stringify(meta) }
                });

                generatedInvoices.push({ invoiceNo: newInvoice.invoiceNo, customer: contract.customer?.name });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cron Job Finished. Generated ${generatedInvoices.length} recurring invoices today.`,
            processed: generatedInvoices
        });

    } catch (e: any) {
        console.error('CRON Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
