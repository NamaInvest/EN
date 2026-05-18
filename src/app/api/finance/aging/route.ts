import { NextResponse } from 'next/server';
import { AgingEngine } from '@/lib/aging-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'AR'; // 'AR' or 'AP'
    const dateParam = searchParams.get('date');
     // In a real system, get this from auth session

    // Optional: Validate session to ensure security
    // const session = await getServerSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asOfDate = dateParam ? new Date(dateParam) : new Date();

    let result;
    if (type === 'AR') {
      result = await AgingEngine.generateARAging(tenant, asOfDate);
    } else if (type === 'AP') {
      result = await AgingEngine.generateAPAging(tenant, asOfDate);
    } else {
      return NextResponse.json({ error: 'Invalid aging type. Use AR or AP.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
    } catch (error: any) {
    console.error('Aging API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate aging report', details: error?.message },
      { status: 500 }
    );
    }
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
