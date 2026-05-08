import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { WorkflowBuilderEngine } from '@/lib/workflow-builder-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const model = req.nextUrl.searchParams.get('model');
    if (!model) return NextResponse.json({ models: WorkflowBuilderEngine.getSupportedModels() });
    try {
        const wf = await WorkflowBuilderEngine.getForModel(prisma, model);
        return NextResponse.json(wf || { message: 'No workflow defined' });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'save') {
            const result = await WorkflowBuilderEngine.saveDefinition(prisma, body.definition, (user as any).tenantId || '');
            return NextResponse.json(result);
        }
        if (body.action === 'transitions') {
            const transitions = await WorkflowBuilderEngine.getAvailableTransitions(prisma, body.model, body.currentState, body.record, (user as any).role, (user as any).id);
            return NextResponse.json({ transitions });
        }
        if (body.action === 'execute') {
            const result = await WorkflowBuilderEngine.executeTransition(prisma, body.model, body.recordId, body.transitionId, (user as any).id, body.note);
            return NextResponse.json(result);
        }
        return NextResponse.json({ error: 'action: save | transitions | execute' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
