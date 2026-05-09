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
        const cards = await prisma.giftCard.findMany({
            take: 100,
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(cards);
    } catch (error: any) {
        console.error('Error fetching gift cards:', error);
        return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
    }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const code = body.code?.trim() || Math.random().toString(36).substring(2, 10).toUpperCase();
        
        if (!body.initialBalance) {
            return NextResponse.json({ error: 'يجب تحديد رصيد البطاقة' }, { status: 400 });
        }

        const existing = await prisma.giftCard.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'كود البطاقة مستخدم مسبقاً' }, { status: 400 });
        }

        const balance = parseFloat(body.initialBalance);
        const card = await prisma.giftCard.create({
            data: {
                code,
                initialBalance: balance,
                currentBalance: balance,
                customerId: body.customerId ? parseInt(body.customerId) : null,
                expiryDate: body.expiryDate || null,
                isActive: true
            }
        });
        
        return NextResponse.json(card, { status: 201 });
    } catch (error: any) {
        console.error('Error creating gift card:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'gift-cards' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
