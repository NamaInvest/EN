import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function _GET() {
    try {
        // Warning: This will delete ALL products and related stocks!
        await prisma.productStock.deleteMany({});
        await prisma.product.deleteMany({});
        return NextResponse.json({ success: true, message: 'All items deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async () => _GET(), { requireAuth: false });
