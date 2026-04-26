import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { id: 'desc' },
            include: { usages: true }
        });
        return NextResponse.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.code || body.discountValue === undefined) {
            return NextResponse.json({ error: 'كود الكوبون وقيمة الخصم مطلوبة' }, { status: 400 });
        }

        // Check for duplicate code
        const existing = await prisma.coupon.findUnique({ where: { code: body.code } });
        if (existing) {
            return NextResponse.json({ error: 'كود الكوبون موجود مسبقاً' }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: body.code.toUpperCase(),
                discountType: body.discountType || 'percentage',
                discountValue: parseFloat(body.discountValue),
                minOrder: parseFloat(body.minOrder || '0'),
                maxUses: parseInt(body.maxUses || '0'),
                startDate: body.startDate || null,
                endDate: body.endDate || null,
                isActive: body.isActive !== false
            }
        });
        
        return NextResponse.json(coupon, { status: 201 });
    } catch (error: any) {
        console.error('Error creating coupon:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'coupons' });
    }
}
