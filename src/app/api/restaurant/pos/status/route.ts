import { NextResponse, NextRequest } from 'next/server';
import { RestaurantCoreEngine } from '@/lib/gaps/restaurant-core-engine';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/restaurant/pos/status
 * POS endpoint to fetch all zones, tables, and their active waiter calls.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId || 'default';

    const liveStatus = await RestaurantCoreEngine.getLiveTableStatus(tenantId);

    return NextResponse.json({
      success: true,
      data: liveStatus
    });

  } catch (error: any) {
    console.error('POS Live Status Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
