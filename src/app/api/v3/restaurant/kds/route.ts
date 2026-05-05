import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const data = await prisma.restaurantKDSTicket.findMany({ take: 50, orderBy: { id: "desc" } });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const data = await prisma.restaurantKDSTicket.create({
            data: { tableNo: body.tableNo || 1, status: "pending", items: body.items || [] }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}