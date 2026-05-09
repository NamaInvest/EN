import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt((await params).id);
        const data = await request.json();
        
        // Disable other defaults if this becomes default
        if (data.isDefault) {
             await prisma.currency.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }
        
        const updated = await prisma.currency.update({
            where: { id },
            data: {
                code: data.code,
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                symbol: data.symbol,
                exchangeRate: parseFloat(data.exchangeRate),
                isDefault: data.isDefault,
                isActive: data.isActive,
            }
        });
        
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("PUT currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt((await params).id);
        await prisma.currency.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ. لا يمكن حذف عملة مرتبطة بعمليات.' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
