import { NextRequest, NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import prisma from "@/lib/prisma";
import { z } from 'zod';

async function _GET(req: NextRequest) {

    try {
        const data = await prisma.serviceTimesheet.findMany({ take: 50, orderBy: { id: "desc" } });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  projectId: z.union([z.string(), z.number()]).optional(),
  hours: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const data = await prisma.serviceTimesheet.create({
            data: { employeeId: body.employeeId || 1, projectId: body.projectId || 1, hours: body.hours || 0, date: new Date() }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
