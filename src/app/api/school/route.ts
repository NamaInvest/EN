import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/prisma';
import { z } from 'zod';

async function _POST(req: NextRequest) {

    try {
        const tenantString = resolveTenant(req as any);
        if (!tenantString) {
            return NextResponse.json({ error: "Missing or invalid Tenant ID" }, { status: 401 });
        }

        const body = await req.json();
        const {
            studentId,
            details, // Array of { description, quantity, unitPrice }
        } = body;

        if (!studentId || !details || details.length === 0) {
            return NextResponse.json({ error: "Student ID and invoice details are required." }, { status: 400 });
        }

        let total = 0;
        for (const item of details) {
            total += (item.quantity * item.unitPrice);
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const invoice = await tx.schoolInvoice.create({
                data: {
                    invoiceNo: `SCH-${Math.floor(Math.random() * 1000000)}`,
                    studentId: studentId,
                    total: total,
                    status: "approved",
                }
            });

            const lineItems = await Promise.all(details.map(async (item: any) => {
                return tx.schoolInvoiceDetail.create({
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
                    invoiceType: "SCHOOL",
                    status: "pending", 
                }
            });

            return { invoice, lineItems, zatcaRecord };
        });

        return NextResponse.json({
            success: true,
            message: "School Invoice Processed Successfully",
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("School API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process school invoice",
            details: error.message
        }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
