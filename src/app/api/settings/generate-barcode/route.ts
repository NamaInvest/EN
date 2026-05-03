import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const setting = await prisma.setting.findUnique({ where: { key: 'next_barcode' } });
        const nextBarcode = setting && setting.value ? parseInt(String(setting.value), 10) : 1000;
        
        await prisma.setting.upsert({
            where: { key: 'next_barcode' },
            update: { value: String(nextBarcode + 1) },
            create: { key: 'next_barcode', value: String(nextBarcode + 1) },
        });

        return NextResponse.json({ barcode: String(nextBarcode) });
    } catch (error) {
        console.error('Barcode generation error:', error);
        return NextResponse.json({ error: 'خطأ في توليد الباركود' }, { status: 500 });
    }
}
