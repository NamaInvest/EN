import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { z } from 'zod';


const _POSTSchema = z.object({
  model: z.any().optional(),
  fields: z.any().optional(),
  limit: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { model, fields, limit } = body;

        if (!model || !fields || fields.length === 0) {
            return NextResponse.json({ error: 'Model and fields are required.' }, { status: 400 });
        }

        // Map model string to Prisma's internal delegate name (e.g., 'SalesInvoice' -> 'salesInvoice')
        const modelNameLower = model.charAt(0).toLowerCase() + model.slice(1);

        const selectObj = fields.reduce((acc: any, field: string) => {
            acc[field] = true;
            return acc;
        }, {});

        const delegate = (prisma as any)[modelNameLower];
        if (!delegate) {
            return NextResponse.json({ error: 'Invalid model selected.' }, { status: 400 });
        }

        const data = await delegate.findMany({
            select: selectObj,
            take: limit || 50,
            orderBy: { id: 'desc' } // Assuming 'id' exists
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'ADMIN' });
