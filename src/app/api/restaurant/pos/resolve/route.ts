import { NextResponse, NextRequest } from 'next/server';
import { RestaurantCoreEngine } from '@/lib/gaps/restaurant-core-engine';
import { getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/restaurant/pos/resolve
 * POS endpoint to resolve a waiter call.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId || 'default';
    const body = await request.json();
    const { callId } = body;

    if (!callId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    await RestaurantCoreEngine.resolveWaiterCall(tenantId, parseInt(callId, 10));

    return NextResponse.json({
      success: true,
      message: 'Waiter call resolved'
    });

  } catch (error: any) {
    console.error('POS Resolve Waiter Call Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
