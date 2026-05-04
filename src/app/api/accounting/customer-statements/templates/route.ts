import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const templates = await prisma.customerStatementTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            isDefault,
            headerMessage,
            footerMessage,
            showAging,
            showPaidInvoices,
            primaryColor,
            userId
        } = body;

        // If setting as default, unset others first
        if (isDefault) {
            await prisma.customerStatementTemplate.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const template = await prisma.customerStatementTemplate.create({
            data: {
                name,
                isDefault: isDefault || false,
                headerMessage,
                footerMessage,
                showAging: showAging ?? true,
                showPaidInvoices: showPaidInvoices ?? false,
                primaryColor: primaryColor || '#000000',
                createdBy: userId ? parseInt(userId, 10) : null
            }
        });

        return NextResponse.json(template);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
