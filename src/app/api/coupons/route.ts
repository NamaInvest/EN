import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const coupons = await prisma.coupon.findMany({
            take: 100,
            orderBy: { id: 'desc' },
            include: { usages: true }
        });
        return NextResponse.json(coupons);
    } catch (error: any) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
