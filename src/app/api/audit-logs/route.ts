import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'غير مصرح للوصول للسجل' }, { status: 403 });
        }
        
        const logs = await prisma.auditLog.findMany({
            include: { user: { select: { id: true, fullName: true, role: true } } },
            orderBy: { date: 'desc' },
            take: 500
        });
        
        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET audit logs error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}
