import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.consolidation.elimination' });

import { getUserFromRequest } from '@/lib/auth';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        // Find Intercompany Customers (type 0 or 2) & Vendors (type 1 or 2)
        const icCustomers = await prisma.customer.findMany({ take: 100,
            where: { tenantId: auth.tenantId, isIntercompany: true, type: { in: [0, 2] } } as any,
            select: { id: true, name: true, balance: true }
        });

        const icVendors = await prisma.customer.findMany({ take: 100,
            where: { tenantId: auth.tenantId, isIntercompany: true, type: { in: [1, 2] } } as any,
            select: { id: true, name: true, balance: true }
        });

        // Pair them up conceptually (simulating matching Co-A AR with Co-B AP)
        // In reality, this would match based on 'tenantId' or 'companyId' linkage
        // We will simulate the pairings for the UI
        const pairs: any[] = [];
        
        icCustomers.forEach((customer: any) => {
            // Find a vendor with similar name or just pair for demo
            const matchingVendor = icVendors.find((v: any) => v.name.includes(customer.name.split(' ')[0])) || icVendors[0];
            
            if (matchingVendor) {
                const arBalance = customer.balance;
                const apBalance = matchingVendor.balance;
                const variance = Math.abs(n(arBalance) - n(apBalance));
                
                pairs.push({
                    id: `pair-${customer.id}-${matchingVendor.id}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    arBalance,
                    vendorId: matchingVendor.id,
                    vendorName: matchingVendor.name,
                    apBalance,
                    variance,
                    status: variance === 0 ? 'MATCHED' : 'VARIANCE',
                    varianceReason: variance > 0 ? 'TIMING_DIFFERENCE' : null
                });
            }
        });

        return NextResponse.json({ success: true, data: pairs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  pairs: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { pairs } = body;

        // Auto-elimination JE on consolidation
        // Create a ConsolidationRun
        const run = await prisma.consolidationRun.create({
            data: {
                tenantId: auth.tenantId,
                groupId: 1, // Assume Group 1 exists
                fiscalPeriodId: 1,
                status: 'ELIMINATED',
                userId: auth.userId,
            }
        });

        const lines = [];

        for (const pair of pairs) {
            const eliminateAmount = Math.min(pair.arBalance, pair.apBalance);

            if (eliminateAmount > 0) {
                // Dr Intercompany Payable (Vendor)
                // Cr Intercompany Receivable (Customer)
                lines.push({
                    runId: run.id,
                    type: 'ELIMINATION',
                    debitAccountId: 2000, // AP mock ID
                    creditAccountId: 1000, // AR mock ID
                    amount: eliminateAmount
                });
            }
        }

        if (lines.length > 0) {
            await prisma.consolidationLine.createMany({
                data: lines
            });
        }

        return NextResponse.json({ success: true, message: 'Elimination completed and JEs generated.' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
