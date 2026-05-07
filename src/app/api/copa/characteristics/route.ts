/**
 * CO-PA Characteristics CRUD
 * GET  /api/copa/characteristics — List all
 * POST /api/copa/characteristics — Create new
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const prisma = await getPrisma(req);
        const items = await prisma.copaCharacteristic.findMany({ orderBy: { id: 'asc' } });
        return NextResponse.json(items);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const prisma = await getPrisma(req);
        const body = await req.json();

        if (!body.code || !body.name || !body.type) {
            return NextResponse.json({ error: 'مطلوب: code, name, type' }, { status: 400 });
        }

        const item = await prisma.copaCharacteristic.create({
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        if (e.code === 'P2002') return NextResponse.json({ error: 'الكود مستخدم مسبقاً' }, { status: 409 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
