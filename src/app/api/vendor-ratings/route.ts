import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor-ratings — قائمة تقييمات الموردين
 * POST /api/vendor-ratings — إضافة تقييم جديد
 */
export async function GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');

    const where: any = {};
    if (supplierId) where.supplierId = parseInt(supplierId);

    // جلب التقييمات مع بيانات المورد
    const ratings = await (prisma as any).vendorRating?.findMany?.({
      where,
      orderBy: { ratedAt: 'desc' },
      take: 100,
    });

    if (!ratings) {
      // الموديل لم يُنشأ بعد في قاعدة البيانات
      return NextResponse.json({ ratings: [], message: 'يحتاج ترحيل قاعدة البيانات (prisma migrate)' });
    }

    // حساب المتوسط لكل مورد
    if (supplierId) {
      const avg = {
        quality: ratings.reduce((s: number, r: any) => s + r.quality, 0) / (ratings.length || 1),
        delivery: ratings.reduce((s: number, r: any) => s + r.delivery, 0) / (ratings.length || 1),
        pricing: ratings.reduce((s: number, r: any) => s + r.pricing, 0) / (ratings.length || 1),
        overall: 0,
        count: ratings.length,
      };
      avg.overall = (avg.quality + avg.delivery + avg.pricing) / 3;
      return NextResponse.json({ ratings, average: avg });
    }

    return NextResponse.json({ ratings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const body = await req.json();
    const { supplierId, grnId, quality, delivery, pricing, notes } = body;

    if (!supplierId) {
      return NextResponse.json({ error: 'معرف المورد مطلوب' }, { status: 400 });
    }

    const rating = await (prisma as any).vendorRating?.create?.({
      data: {
        supplierId: parseInt(supplierId),
        grnId: grnId ? parseInt(grnId) : null,
        quality: Math.min(5, Math.max(1, parseInt(quality) || 5)),
        delivery: Math.min(5, Math.max(1, parseInt(delivery) || 5)),
        pricing: Math.min(5, Math.max(1, parseInt(pricing) || 5)),
        notes: notes || null,
        ratedBy: user.userId,
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'يحتاج ترحيل قاعدة البيانات (prisma migrate)' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rating });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
