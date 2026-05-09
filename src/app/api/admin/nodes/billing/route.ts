import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();


const _POSTSchema = z.object({
  subdomain: z.any().optional(),
  paymentStatus: z.any().optional(),
  subscriptionDuration: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'ADMIN' });
