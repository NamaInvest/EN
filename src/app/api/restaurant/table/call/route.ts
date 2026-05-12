import { NextResponse } from 'next/server';
import { RestaurantCoreEngine } from '@/lib/gaps/restaurant-core-engine';


/**
 * POST /api/restaurant/table/call
 * Guest-facing endpoint to call a waiter. Uses the secure QR Token.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Process the call using the engine
    // Engine guarantees idempotency (prevents duplicate spam calls from the same table)
    const waiterCall = await RestaurantCoreEngine.requestWaiter(token);

    // TODO: If WebSockets/Pusher is configured, emit an event here to notify POS UI.
    // Example: PusherServer.trigger(`tenant-${waiterCall.tenantId}`, 'waiter-called', waiterCall);

    return NextResponse.json({
      success: true,
      message: 'Waiter called successfully',
      callId: waiterCall.id
    });

  } catch (error: any) {
    console.error('Waiter Call Error:', error);
    
    if (error.message.includes('SEC_ERR')) {
      return NextResponse.json({ error: 'Invalid or Expired Table QR' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
