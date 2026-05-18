import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { checkCredit } from '@/lib/credit-check';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.invoices' });


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  totalAmount: z.number().optional(),
  bypassCreditLimit: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(req as any);
        const { customerId, totalAmount, bypassCreditLimit } = body;

        if (!customerId || totalAmount === undefined) {
            return NextResponse.json({ error: 'Customer ID and totalAmount are required' }, { status: 400 });
        }

        // 1. Perform Credit Limit Check before creating invoice
        // Check if the user has requested a bypass (in reality, verify user permissions via token)
        const hasBypassPermission = bypassCreditLimit === true; 

        const creditResult = await checkCredit(prisma as any, customerId, totalAmount, hasBypassPermission);

        if (!creditResult.passed) {
            return NextResponse.json({ 
                error: 'Credit Limit Exceeded or Customer On Hold', 
                reason: creditResult.reason,
                details: creditResult 
            }, { status: 422 });
        }

        // 2. Proceed to create invoice
        const invoice = await prisma.salesInvoice.create({
            data: {
                tenantId,
                customerId,
                total: totalAmount,
                invoiceNo: Math.floor(Math.random() * 1000000), // Should use numbering engine in reality
                status: 'DRAFT',
                // other fields would be populated here
            }
        });

        // 3. Log bypass if it happened
        if (hasBypassPermission && creditResult.totalExposure > creditResult.creditLimit) {
            await prisma.documentStateLog.create({
                data: {
                    tenantId,
                    entityType: 'INVOICE',
                    entityId: invoice.id,
                    fromState: 'NEW',
                    toState: 'DRAFT',
                    reason: `Credit Limit Bypassed. Limit: ${creditResult.creditLimit}, Exposure: ${creditResult.totalExposure}`
                }
            });
        }

        return NextResponse.json(invoice, { status: 201 });

    } catch (e: any) {
        log.error('Invoice Creation Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
