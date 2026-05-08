import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/prisma';

export async function POST(req: NextRequest) {

    try {
        const tenantString = resolveTenant(req as any);
        if (!tenantString) {
            return NextResponse.json({ error: "Missing or invalid Tenant ID" }, { status: 401 });
        }

        const body = await req.json();
        const {
            customerId,
            details, // Array of { description, quantity, unitPrice }
        } = body;

        if (!customerId || !details || details.length === 0) {
            return NextResponse.json({ error: "Customer ID and rent details are required." }, { status: 400 });
        }

        let total = 0;
        for (const item of details) {
            total += (item.quantity * item.unitPrice);
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const invoice = await tx.rentInvoice.create({
                data: {
                    invoiceNo: `RNT-${Math.floor(Math.random() * 1000000)}`,
                    customerId: customerId,
                    total: total,
                    status: "approved",
                }
            });

            const lineItems = await Promise.all(details.map(async (item: any) => {
                return tx.rentInvoiceDetail.create({
                    data: {
                        invoiceId: invoice.id,
                        description: item.description,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        total: Number(item.quantity) * Number(item.unitPrice),
                    }
                });
            }));

            const zatcaRecord = await tx.zATCARecord.create({
                data: {
                    invoiceId: invoice.id,
                    invoiceType: "RENT",
                    status: "pending", 
                }
            });

            return { invoice, lineItems, zatcaRecord };
        });

        return NextResponse.json({
            success: true,
            message: "Rent Invoice Processed Successfully",
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("Rent API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process rent invoice",
            details: error.message
        }, { status: 500 });
    }
}
