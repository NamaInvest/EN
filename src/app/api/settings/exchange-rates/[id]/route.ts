import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt((await params).id);
        await prisma.exchangeRate.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE exchange rate error:", error);
        return NextResponse.json({ error: 'حدث خطأ.' }, { status: 500 });
    }
}
