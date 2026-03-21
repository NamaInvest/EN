import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt(params.id);
        await prisma.exchangeRate.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE exchange rate error:", error);
        return NextResponse.json({ error: 'حدث خطأ.' }, { status: 500 });
    }
}
