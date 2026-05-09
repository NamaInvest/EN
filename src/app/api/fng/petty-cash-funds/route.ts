import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const data = await prisma.pettyCashFund.findMany({
            take: 100,
            include: { custodian: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  custodianId: z.union([z.string(), z.number()]).optional(),
  fundName: z.any().optional(),
  maxLimit: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const body = await req.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        
        // Ensure there is at least one employee if not provided
        let empId = parseInt(body.custodianId);
        if (!empId) {
            const firstEmp = await prisma.employee.findFirst();
            if (firstEmp) {
                empId = firstEmp.id;
            } else {
                const newEmp = await prisma.employee.create({
                    data: { name: 'أمين الصندوق (افتراضي)', position: 'أمين صندوق', salary: 0 }
                });
                empId = newEmp.id;
            }
        }

        const data = await prisma.pettyCashFund.create({
            data: {
                fundName: body.fundName,
                custodianId: empId,
                maxLimit: parseFloat(body.maxLimit) || 0,
                currentBalance: parseFloat(body.currentBalance) || 0,
                status: body.status || 'ACTIVE'
            },
            include: { custodian: true }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  fundName: z.any().optional(),
  custodianId: z.union([z.string(), z.number()]).optional(),
  maxLimit: z.any().optional(),
  currentBalance: z.any().optional(),
  status: z.any().optional(),
}).passthrough();

async function _PUT(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const body = await req.json();
        const data = await prisma.pettyCashFund.update({
            where: { id: parseInt(body.id) },
            data: {
                fundName: body.fundName,
                custodianId: body.custodianId ? parseInt(body.custodianId) : undefined,
                maxLimit: parseFloat(body.maxLimit),
                currentBalance: parseFloat(body.currentBalance),
                status: body.status
            },
            include: { custodian: true }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _DELETE(req: NextRequest) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(req as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req as any);

    try {
        const url = new URL(req.url);
        const id = parseInt(url.searchParams.get('id') || '0');
        await prisma.pettyCashFund.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
