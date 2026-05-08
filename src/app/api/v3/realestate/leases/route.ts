import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {

    try {
        const data = await prisma.realEstateLease.findMany({ take: 50, orderBy: { id: "desc" } });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));
        const data = await prisma.realEstateLease.create({
            data: { propertyId: body.propertyId || 1, tenantId: body.tenantId || 1, rentAmount: body.rentAmount || 0, startDate: new Date(), endDate: new Date(), status: "active" }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}