import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'crm.opportunities' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        // Make sure default stages exist
        const stagesCount = await prisma.pipelineStage.count();
        if (stagesCount === 0) {
            await prisma.pipelineStage.createMany({
                data: [
                    { code: 'PROSPECT', name: 'Prospect', defaultProbability: 10, sortOrder: 1 },
                    { code: 'QUALIFIED', name: 'Qualified', defaultProbability: 30, sortOrder: 2 },
                    { code: 'PROPOSAL', name: 'Proposal', defaultProbability: 60, sortOrder: 3 },
                    { code: 'NEGOTIATION', name: 'Negotiation', defaultProbability: 80, sortOrder: 4 },
                    { code: 'WON', name: 'Closed Won', defaultProbability: 100, sortOrder: 5, isWon: true },
                    { code: 'LOST', name: 'Closed Lost', defaultProbability: 0, sortOrder: 6, isLost: true },
                ]
            });
        }

        const stages = await prisma.pipelineStage.findMany({
            take: 100, orderBy: { sortOrder: 'asc' } });
        const opportunities = await prisma.opportunity.findMany({
            take: 100,
            include: { stage: true, account: true },
            orderBy: { expectedCloseDate: 'asc' }
        });

        // Also fetch accounts for the dropdown
        const accounts = await prisma.crmAccount.findMany({
            take: 100, select: { id: true, name: true } });

        return NextResponse.json({ success: true, data: { stages, opportunities, accounts } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  payload: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, payload } = body;

        if (action === 'CREATE') {
            // Ensure we have an account
            let accountId = payload.accountId;
            if (!accountId) {
                // Check if dummy account exists or create
                let acc = await prisma.crmAccount.findFirst();
                if (!acc) acc = await prisma.crmAccount.create({ data: { name: 'Default Account' } });
                accountId = acc.id;
            }

            const stage = await prisma.pipelineStage.findUnique({ where: { id: Number(payload.stageId) } });

            const newOpp = await prisma.opportunity.create({
                data: {
                    name: payload.name,
                    amount: Number(payload.amount),
                    accountId: Number(accountId),
                    stageId: Number(payload.stageId),
                    probability: stage?.defaultProbability || 0,
                    expectedCloseDate: payload.expectedCloseDate ? new Date(payload.expectedCloseDate) : null,
                }
            });
            return NextResponse.json({ success: true, data: newOpp });
        }

        if (action === 'UPDATE_STAGE') {
            const stage = await prisma.pipelineStage.findUnique({ where: { id: Number(payload.stageId) } });
            
            const dataToUpdate: any = { 
                stageId: Number(payload.stageId),
                probability: stage?.defaultProbability || 0
            };

            if (payload.reason) {
                if (stage?.isWon) dataToUpdate.wonReason = payload.reason;
                if (stage?.isLost) dataToUpdate.lostReason = payload.reason;
            }

            const updated = await prisma.opportunity.update({
                where: { id: Number(payload.opportunityId) },
                data: dataToUpdate
            });
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
