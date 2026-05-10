import { NextRequest, NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import prisma from "@/lib/prisma";
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'v3.school.sis' });

async function _GET(req: NextRequest) {

    try {
        const data = await prisma.schoolStudent.findMany({ take: 50, orderBy: { id: "desc" } });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  grade: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const data = await prisma.schoolStudent.create({
            data: { name: body.name || "Unknown", grade: body.grade || "G1" }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
