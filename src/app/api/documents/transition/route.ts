import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getStateMachineFor, BaseState } from '@/lib/state-machine';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'documents.transition' });


const _POSTSchema = z.object({
  entityType: z.any().optional(),
  entityId: z.union([z.string(), z.number()]).optional(),
  targetState: z.any().optional(),
  currentState: z.any().optional(),
  reason: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const { getUserFromRequest } = require('@/lib/auth');
        const auth = getUserFromRequest(req as any);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { entityType, entityId, targetState, currentState, reason } = body;

        if (!entityType || !entityId || !targetState || !currentState) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const machine = getStateMachineFor(entityType);

        // Verify it can transition
        if (!machine.canTransition(currentState as BaseState, targetState as BaseState)) {
            return NextResponse.json({ 
                error: `Invalid transition for ${entityType} from ${currentState} to ${targetState}` 
            }, { status: 400 });
        }

        // Apply transition using a transaction so both the entity update and log are atomic
        await prisma.$transaction(async (tx: any) => {
            // Write the state log (handled by machine, but we pass prisma down or we just create it here)
            // Wait, the machine instances in state-machine.ts import a global prisma.
            // For multitenancy, we should ideally create the log using this request's tx.
            await tx.documentStateLog.create({
                data: {
                    entityType,
                    entityId: parseInt(entityId),
                    fromState: currentState,
                    toState: targetState,
                    userId: auth.userId || null,
                    reason: reason || null,
                }
            });

            // Update the actual entity table dynamically
            // Note: In Prisma, dynamic model access is possible via tx[modelName]
            let modelName = '';
            switch (entityType) {
                case 'INVOICE': modelName = 'salesInvoice'; break;
                case 'PO': 
                case 'PURCHASE_ORDER': modelName = 'purchaseOrder'; break;
                case 'GRN': modelName = 'goodsReceiptNote'; break;
                case 'JOURNAL_ENTRY': modelName = 'journalEntry'; break;
                // Add more mappings as needed
            }

            if (modelName) {
                // Determine the status field name (usually 'status', but could be 'state')
                // Assuming 'status' is widely used
                await tx[modelName].update({
                    where: { id: parseInt(entityId) },
                    data: { status: targetState }
                });
            }
        });

        return NextResponse.json({ success: true, message: 'Status updated' });
    } catch (e: any) {
        log.error('State transition error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
