/**
 * Document State Machine API
 * GET  — list transitions for a docType
 * POST — create transition / seed defaults
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { transition, getAvailableActions, seedDefaultTransitions } from '@/lib/state-machine-engine';

const db = (p: any) => p as any;

export async function GET(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const docType = req.nextUrl.searchParams.get('docType');
        const currentState = req.nextUrl.searchParams.get('state');

        if (docType && currentState) {
            const actions = await getAvailableActions(prisma, docType, currentState);
            return NextResponse.json(actions);
        }

        const items = await db(prisma).documentStateMachine.findMany({
            take: 100,
            where: docType ? { docType } : undefined,
            orderBy: [{ docType: 'asc' }, { fromState: 'asc' }],
        });
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
            const count = await seedDefaultTransitions(prisma);
            return NextResponse.json({ seeded: count });
        }

        if (body.action === 'transition') {
            const result = await transition(prisma, body.docType, body.currentState, body.transitionAction, body.userRole);
            if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
            return NextResponse.json(result);
        }

        if (!body.docType || !body.fromState || !body.toState || !body.transitionAction) {
            return NextResponse.json({ error: 'مطلوب: docType, fromState, toState, transitionAction' }, { status: 400 });
        }

        const item = await db(prisma).documentStateMachine.create({
            data: {
                docType: body.docType, fromState: body.fromState, toState: body.toState,
                action: body.transitionAction, requiredRole: body.requiredRole || null, isActive: true,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
