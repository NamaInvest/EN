import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const rules = await prisma.approvalRule.findMany({
            take: 100,
            include: { approver: { select: { id: true, fullName: true, role: true } } },
            orderBy: { level: 'asc' }
        });
        return NextResponse.json(rules);
    } catch (error: any) {
        console.error("GET approvals error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
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
    } catch (error: any) {
        console.error("POST approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 });
    }
}
