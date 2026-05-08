import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkCredit } from '@/lib/credit-check';

export async function POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { customerId, totalAmount, bypassCreditLimit } = body;

        if (!customerId || totalAmount === undefined) {
            return NextResponse.json({ error: 'Customer ID and totalAmount are required' }, { status: 400 });
        }

        // 1. Perform Credit Limit Check before creating invoice
        // Check if the user has requested a bypass (in reality, verify user permissions via token)
        const hasBypassPermission = bypassCreditLimit === true; 

        const creditResult = await checkCredit(prisma as any, customerId, totalAmount, hasBypassPermission);

        if (!creditResult.passed) {
            return NextResponse.json({ 
                error: 'Credit Limit Exceeded or Customer On Hold', 
                reason: creditResult.reason,
                details: creditResult 
            }, { status: 422 });
        }

        // 2. Proceed to create invoice
        const invoice = await prisma.salesInvoice.create({
            data: {
                customerId,
                total: totalAmount,
                invoiceNo: Math.floor(Math.random() * 1000000), // Should use numbering engine in reality
                status: 'DRAFT',
                // other fields would be populated here
            }
        });

        // 3. Log bypass if it happened
        if (hasBypassPermission && creditResult.totalExposure > creditResult.creditLimit) {
            await prisma.documentStateLog.create({
                data: {
                    entityType: 'INVOICE',
                    entityId: invoice.id,
                    fromState: 'NEW',
                    toState: 'DRAFT',
                    reason: `Credit Limit Bypassed. Limit: ${creditResult.creditLimit}, Exposure: ${creditResult.totalExposure}`
                }
            });
        }

        return NextResponse.json(invoice, { status: 201 });

    } catch (e: any) {
        console.error('Invoice Creation Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
