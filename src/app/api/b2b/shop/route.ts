import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getB2BUserFromRequest } from '@/lib/b2b-auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const auth = getB2BUserFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

        const products = await prisma.product.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                barcode: true,
                sellPrice: true,
                currentStock: true,
                taxRate: true,
                imagePath: true,
            },
            take: 300 // fetch up to 300 products for Phase 1 MVP
        });

        return NextResponse.json({ success: true, products });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
