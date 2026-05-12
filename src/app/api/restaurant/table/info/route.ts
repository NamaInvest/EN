import { NextResponse } from 'next/server';
import { RestaurantCoreEngine } from '@/lib/gaps/restaurant-core-engine';

/**
 * GET /api/restaurant/table/info?token=xyz
 * Guest-facing endpoint to fetch table information (and menu) using the secure QR Token.
 * Does NOT require standard dashboard authentication.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // This will securely fetch the table based on the un-guessable token.
    const tableInfo = await RestaurantCoreEngine.getTableByToken(token);

    // TODO: Include active menu categories/items for the tenant here.
    // For now, we return table info to render the generic "Call Waiter" interface.
    return NextResponse.json({
      success: true,
      table: {
        id: tableInfo.id,
        tableNumber: tableInfo.name, // Prisma model has `name` field for RestaurantTable
        zone: tableInfo.zone.name,
        capacity: tableInfo.capacity,
        status: tableInfo.status
      }
    });

  } catch (error: any) {
    console.error('Table Info Fetch Error:', error);
    
    // Security measure: Do not leak DB errors. 
    // If token is invalid or table not found, just return generic 404 or 403.
    if (error.message.includes('SEC_ERR')) {
      return NextResponse.json({ error: 'Invalid or Expired Table QR' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
