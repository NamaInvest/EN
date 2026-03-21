import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt(params.id);
        const data = await request.json();
        
        const updated = await prisma.approvalRule.update({
            where: { id },
            data: {
                documentType: data.documentType,
                minAmount: parseFloat(data.minAmount) || 0,
                maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
                approverRole: data.approverRole || '',
                approverId: data.approverId ? parseInt(data.approverId) : null,
                level: parseInt(data.level) || 1,
                isActive: data.isActive,
            }
        });
        
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt(params.id);
        await prisma.approvalRule.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ. لا يمكن حذف القاعدة المرتبطة بعمليات.' }, { status: 500 });
    }
}
