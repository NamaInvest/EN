/**
 * Number Sequences API
 * GET  — list all sequences
 * POST — create / update a sequence
 * PUT  — get next number (atomic)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { NumberingEngine } from '@/lib/numbering-engine';

const db = (p: any) => p as any;

export async function GET(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const items = await NumberingEngine.getAll(prisma);
        return NextResponse.json(items);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const body = await req.json();

        if (body.action === 'seed') {
            const count = await NumberingEngine.seedDefaults(prisma);
            return NextResponse.json({ seeded: count });
        }

        if (!body.code || !body.name) {
            return NextResponse.json({ error: 'مطلوب: code, name' }, { status: 400 });
        }

        const item = await NumberingEngine.upsert(prisma, {
            code: body.code, 
            name: body.name, 
            prefix: body.prefix || '', 
            suffix: body.suffix || '', 
            padLength: body.padLength || 6, 
            resetPeriod: body.resetPeriod || 'NEVER'
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const body = await req.json();

        if (!body.code) return NextResponse.json({ error: 'مطلوب: code' }, { status: 400 });

        const number = await NumberingEngine.getNext(prisma, body.code);
        return NextResponse.json({ number });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
