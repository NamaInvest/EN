import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const rates = await prisma.exchangeRate.findMany({
            take: 100,
            orderBy: { date: 'desc' },
            include: { currency: true }
        });
        return NextResponse.json(rates);
    } catch (error) {
        console.error("GET exchange rates error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const data = await request.json();
        
        const newRate = await prisma.exchangeRate.create({
            data: {
                currencyId: parseInt(data.currencyId),
                rate: parseFloat(data.rate),
                date: data.date ? new Date(data.date) : new Date(),
            }
        });
        
        // Also update the current exchange rate in the Currency table
        if (data.updateCurrency) {
            await prisma.currency.update({
                where: { id: parseInt(data.currencyId) },
                data: { exchangeRate: parseFloat(data.rate) }
            });
        }
        
        return NextResponse.json(newRate);
    } catch (error) {
        console.error("POST exchange rate error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 });
    }
}
