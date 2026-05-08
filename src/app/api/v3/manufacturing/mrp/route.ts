import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {

    try {
        const data = await prisma.manufacturingBOM.findMany({ take: 50, orderBy: { id: "desc" } });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));
        const data = await prisma.manufacturingBOM.create({
            data: { productId: body.productId || 1, version: "v1.0", components: body.components || [] }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}