import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'coupons.validate' });

const _POSTSchema = z.object({
  code: z.any().optional(),
  cartTotal: z.number().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { code, cartTotal } = body;

        if (!code) {
            return NextResponse.json({ error: 'كود الكوبون مطلوب' }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return NextResponse.json({ error: 'كوبون غير صالح أو غير موجود' }, { status: 404 });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ error: 'هذا الكوبون غير فعال' }, { status: 400 });
        }

        const now = new Date();
        
        // Check Start Date
        if (coupon.startDate) {
            const start = new Date(coupon.startDate);
            if (now < start) {
                return NextResponse.json({ error: 'تاريخ بداية الكوبون لم يحن بعد' }, { status: 400 });
            }
        }

        // Check End Date
        if (coupon.endDate) {
            const end = new Date(coupon.endDate);
            // End Date inclusive to the end of the day technically, but strict comparison here
            if (now > end) {
                return NextResponse.json({ error: 'هذا الكوبون منتهي الصلاحية' }, { status: 400 });
            }
        }

        // Check Max Uses
        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ error: 'تم تجاوز الحد الأقصى لاستخدام الكوبون' }, { status: 400 });
        }

        // Check Minimum Order Value
        if (cartTotal && n(coupon.minOrder) > 0 && cartTotal < n(coupon.minOrder)) {
            return NextResponse.json({ error: `الحد الأدنى للطلب لاستخدام الكوبون هو ${n(coupon.minOrder)}` }, { status: 400 });
        }

        return NextResponse.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        });

    } catch (error: any) {
        log.error('Error validating coupon:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'coupons/validate' });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
