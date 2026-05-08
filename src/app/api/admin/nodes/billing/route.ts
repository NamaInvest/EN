import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {

    try {
        const body = await req.json();
        const { subdomain, paymentStatus, subscriptionDuration } = body;
        
        if (!subdomain) {
            return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;
        if (subscriptionDuration) dataToUpdate.subscriptionDuration = subscriptionDuration;

        const updated = await prisma.tenantAccount.update({
            where: { subdomain },
            data: dataToUpdate
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        console.error("[ADMIN_BILLING_API]", e);
        return NextResponse.json({ error: "Failed to update tenant billing." }, { status: 500 });
    }
}
