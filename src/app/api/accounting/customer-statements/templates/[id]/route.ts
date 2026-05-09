import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';

async function _PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const id = parseInt((await params).id, 10);
        const body = await req.json();
        
        if (body.isDefault) {
            await prisma.customerStatementTemplate.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const template = await prisma.customerStatementTemplate.update({
            where: { id },
            data: {
                name: body.name,
                isDefault: body.isDefault,
                headerMessage: body.headerMessage,
                footerMessage: body.footerMessage,
                showAging: body.showAging,
                showPaidInvoices: body.showPaidInvoices,
                primaryColor: body.primaryColor
            }
        });

        return NextResponse.json(template);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const id = parseInt((await params).id, 10);
        await prisma.customerStatementTemplate.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'FINANCIAL' });
