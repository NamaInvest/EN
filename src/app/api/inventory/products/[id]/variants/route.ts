import { NextRequest, NextResponse } from 'next/server';
import { ProductVariantEngine } from '@/lib/product-variant-engine';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const variants = await ProductVariantEngine.getVariants(parseInt(params.id, 10));
        return NextResponse.json(variants);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        body.parentProductId = parseInt(params.id, 10);
        const variant = await ProductVariantEngine.createVariant(body);
        return NextResponse.json(variant);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
