/**
 * Document State Machine API
 * GET  — list transitions for a docType
 * POST — create transition / seed defaults
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { transition, getAvailableActions, seedDefaultTransitions } from '@/lib/state-machine-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.state-machine' });

const db = (p: any) => p as any;

async function _GET(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const docType = req.nextUrl.searchParams.get('docType');
        const currentState = req.nextUrl.searchParams.get('state');

        if (docType && currentState) {
            const actions = await getAvailableActions(prisma, docType, currentState);
            return NextResponse.json(actions);
        }

        const items = await db(prisma).documentStateMachine.findMany({ take: 100,
            where: docType ? { docType } : undefined,
            orderBy: [{ docType: 'asc' }, { fromState: 'asc' }],
        });
        return NextResponse.json(items);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  docType: z.any().optional(),
  currentState: z.any().optional(),
  transitionAction: z.any().optional(),
  userRole: z.any().optional(),
  fromState: z.any().optional(),
  toState: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
