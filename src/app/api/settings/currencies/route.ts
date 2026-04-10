import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        let currencies = await prisma.currency.findMany({
            orderBy: { id: 'asc' }
        });

        if (currencies.length === 0) {
            await prisma.currency.createMany({
                data: [
                    { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س', exchangeRate: 1.0, isDefault: true, isActive: true },
                    { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$', exchangeRate: 3.75, isDefault: false, isActive: true },
                    { code: 'EUR', nameAr: 'يورو', nameEn: 'Euro', symbol: '€', exchangeRate: 4.10, isDefault: false, isActive: true },
                    { code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 1.02, isDefault: false, isActive: true },
                    { code: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', symbol: 'د.ك', exchangeRate: 12.20, isDefault: false, isActive: true },
                    { code: 'BHD', nameAr: 'دينار بحريني', nameEn: 'Bahraini Dinar', symbol: 'د.ب', exchangeRate: 9.95, isDefault: false, isActive: true },
                    { code: 'QAR', nameAr: 'ريال قطري', nameEn: 'Qatari Riyal', symbol: 'ر.ق', exchangeRate: 1.03, isDefault: false, isActive: true },
                    { code: 'OMR', nameAr: 'ريال عماني', nameEn: 'Omani Rial', symbol: 'ر.ع', exchangeRate: 9.74, isDefault: false, isActive: true }
                ]
            });
            currencies = await prisma.currency.findMany({
                orderBy: { id: 'asc' }
            });
        }

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
