import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const currencies = await prisma.currency.findMany({
            orderBy: { id: 'asc' }
        });
        return NextResponse.json(currencies);
    } catch (error) {
        console.error("GET currencies error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const data = await request.json();
        
        // Disable other defaults if this becomes default
        if (data.isDefault) {
            await prisma.currency.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }
        
        const newCurrency = await prisma.currency.create({
            data: {
                code: data.code,
                nameAr: data.nameAr,
                nameEn: data.nameEn || null,
                symbol: data.symbol || null,
                exchangeRate: parseFloat(data.exchangeRate) || 1.0,
                isDefault: data.isDefault || false,
                isActive: data.isActive !== undefined ? data.isActive : true,
            }
        });
        
        return NextResponse.json(newCurrency);
    } catch (error) {
        console.error("POST currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 });
    }
}
