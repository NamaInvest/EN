import { NextRequest, NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import prisma from "@/lib/prisma";
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'v3.realestate.leases' });

async function _GET(req: NextRequest) {

    try {
        const data = await prisma.realEstateLease.findMany({ take: 50, orderBy: { id: "desc" } });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  propertyId: z.union([z.string(), z.number()]).optional(),
  tenantId: z.union([z.string(), z.number()]).optional(),
  rentAmount: z.number().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const data = await prisma.realEstateLease.create({
            data: { propertyId: body.propertyId || 1, tenantId: body.tenantId || 1, rentAmount: body.rentAmount || 0, startDate: new Date(), endDate: new Date(), status: "active" }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
