import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const rules = await prisma.approvalRule.findMany({
            include: { approver: { select: { id: true, fullName: true, role: true } } },
            orderBy: { level: 'asc' }
        });
        return NextResponse.json(rules);
    } catch (error) {
        console.error("GET approvals error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const data = await request.json();
        
        const newRule = await prisma.approvalRule.create({
            data: {
                documentType: data.documentType,
                minAmount: parseFloat(data.minAmount) || 0,
                maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
                approverRole: data.approverRole || '',
                approverId: data.approverId ? parseInt(data.approverId) : null,
                level: parseInt(data.level) || 1,
                isActive: data.isActive !== undefined ? data.isActive : true,
            }
        });
        
        return NextResponse.json(newRule);
    } catch (error) {
        console.error("POST approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 });
    }
}
