import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { BankReconciliationEngine } from '@/lib/bank-reconciliation-ui-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _POSTSchema = z.object({
  action: z.any().optional(),
  csv: z.any().optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
  lines: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'parse') {
            const lines = BankReconciliationEngine.parseCSV(body.csv);
            return NextResponse.json({ lines, count: lines.length });
        }
        if (body.action === 'match') {
            const results = await BankReconciliationEngine.autoMatch(prisma, body.bankAccountId, body.lines);
            return NextResponse.json({ results });
        }
        if (body.action === 'summary') {
            const summary = await BankReconciliationEngine.getSummary(prisma, body.bankAccountId);
            return NextResponse.json(summary);
        }
        return NextResponse.json({ error: 'action: parse | match | summary' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
