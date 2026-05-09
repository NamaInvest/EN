import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const setting = await prisma.setting.findUnique({ where: { key: 'next_barcode' } });
        const nextBarcode = setting && setting.value ? parseInt(String(setting.value), 10) : 1000;
        
        await prisma.setting.upsert({
            where: { key: 'next_barcode' },
            update: { value: String(nextBarcode + 1) },
            create: { key: 'next_barcode', value: String(nextBarcode + 1) },
        });

        return NextResponse.json({ barcode: String(nextBarcode) });
    } catch (error: any) {
        console.error('Barcode generation error:', error);
        return NextResponse.json({ error: 'خطأ في توليد الباركود' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
