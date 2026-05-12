import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, currentRequestStore } from '@/lib/prisma';

async function _GET(request: NextRequest) {
    const tenantId1 = currentRequestStore.getStore();
    const prisma = getPrisma(request);
    
    // @ts-ignore
    const count = await prisma.product.count();

    return NextResponse.json({
        resolvedTenant: tenantId1,
        headerTenant: request.headers.get('x-tenant'),
        productCount: count
    });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
