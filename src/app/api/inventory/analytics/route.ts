/**
 * Inventory Analytics API (ABC/XYZ + Slow-Moving + Stock Reservation)
 * ══════════════════════════════════════════════════════════════════════
 * GET  /api/inventory/analytics?type=abc-xyz&months=12
 * GET  /api/inventory/analytics?type=slow-moving&slowDays=90&deadDays=180
 * GET  /api/inventory/analytics?type=reservation&productId=X&warehouseId=Y
 * POST /api/inventory/analytics  — create reservation
 * DELETE /api/inventory/analytics?reservationId=N  — cancel reservation
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ABCXYZEngine, SlowMovingEngine, StockReservationEngine } from '@/lib/inventory-analytics-engine';

const log = logger.child({ service: 'api.inventory.analytics' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'abc-xyz';

    switch (type) {
      case 'abc-xyz': {
        const months = parseInt(searchParams.get('months') || '12');
        const result = await ABCXYZEngine.analyze(months);
        return NextResponse.json(result);
      }

      case 'slow-moving': {
        const slowDays = parseInt(searchParams.get('slowDays') || '90');
        const deadDays = parseInt(searchParams.get('deadDays') || '180');
        const result = await SlowMovingEngine.analyze(slowDays, deadDays);
        return NextResponse.json(result);
      }

      case 'reservation': {
        const productId  = searchParams.get('productId');
        const warehouseId = searchParams.get('warehouseId');
        if (!productId || !warehouseId) {
          return NextResponse.json({ error: 'productId و warehouseId مطلوبان' }, { status: 400 });
        }
        const availability = await StockReservationEngine.getAvailable(
          parseInt(productId), parseInt(warehouseId)
        );
        return NextResponse.json(availability);
      }

      default:
        return NextResponse.json({ error: 'نوع تحليل غير معروف' }, { status: 400 });
    }
  } catch (error: any) {
    log.error('Inventory analytics GET error:', error);
    return NextResponse.json({ error: 'فشل تحليل المخزون' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await request.json();
    const { action } = body;

    if (action === 'reserve') {
      const { productId, warehouseId, quantity, reservedFor, referenceId, referenceType, expiresAt } = body;
      if (!productId || !warehouseId || !quantity) {
        return NextResponse.json({ error: 'productId, warehouseId, quantity مطلوبة' }, { status: 400 });
      }
      const result = await StockReservationEngine.reserve({
        productId: parseInt(productId),
        warehouseId: parseInt(warehouseId),
        quantity: parseFloat(quantity),
        reservedFor: reservedFor || 'OTHER',
        referenceId: parseInt(referenceId || 0),
        referenceType: referenceType || 'MANUAL',
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 409 });
    }

    if (action === 'fulfill') {
      const { reservationId } = body;
      await StockReservationEngine.fulfill(parseInt(reservationId));
      return NextResponse.json({ success: true, message: 'تم تحويل الحجز إلى صرف فعلي' });
    }

    if (action === 'cancel') {
      const { reservationId, reason } = body;
      await StockReservationEngine.cancel(parseInt(reservationId), reason);
      return NextResponse.json({ success: true, message: 'تم إلغاء الحجز' });
    }

    if (action === 'expire-old') {
      const count = await StockReservationEngine.expireOld();
      return NextResponse.json({ success: true, expired: count });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('Inventory analytics POST error:', error);
    return NextResponse.json({ error: 'فشل معالجة طلب المخزون' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
