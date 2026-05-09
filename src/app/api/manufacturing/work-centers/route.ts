import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const centers = await prisma.workCenter.findMany({
            take: 100,
            include: {
                machine: true,
                operations: true
            }
        });
        return NextResponse.json(centers);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch work centers' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  code: z.any().optional(),
  costPerHour: z.number().optional(),
  capacity: z.any().optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { name, code, costPerHour, capacity, machineId } = body;

        const center = await prisma.workCenter.create({
            data: {
                name,
                code,
                costPerHour: parseFloat(costPerHour) || 0,
                capacity: parseFloat(capacity) || 1,
                machineId: machineId ? parseInt(machineId) : null
            }
        });

        return NextResponse.json({ message: 'تم إضافة مركز العمل بنجاح', data: center });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create work center' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
