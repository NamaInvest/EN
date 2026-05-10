import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.bank-recon.rules.simulate' });


const _POSTSchema = z.object({
  description: z.any().optional(),
  amount: z.number().optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { description, amount, bankAccountId } = body;

        // Fetch active rules sorted by priority
        const rules = await prisma.bankReconRule.findMany({
            take: 100,
            where: { 
                enabled: true,
                OR: [
                    { bankAccountId: null },
                    { bankAccountId: bankAccountId ? Number(bankAccountId) : undefined }
                ]
            },
            orderBy: { priority: 'asc' }
        });

        let matchedRule = null;
        let confidenceScore = 0;

        for (const rule of rules) {
            const conditions: any[] = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
            
            let allMatch = true;
            for (const cond of conditions) {
                if (cond.field === 'description' && cond.operator === 'contains') {
                    if (!description.toLowerCase().includes((cond.value || '').toLowerCase())) {
                        allMatch = false;
                        break;
                    }
                }
                if (cond.field === 'amount_range') {
                    const val = Number(amount);
                    if (val < cond.min || val > cond.max) {
                        allMatch = false;
                        break;
                    }
                }
            }

            if (allMatch && conditions.length > 0) {
                matchedRule = rule;
                confidenceScore = 100; // Simplified
                break; // Stop at first match because they are ordered by priority
            }
        }

        if (matchedRule) {
            return NextResponse.json({ 
                success: true, 
                data: {
                    matchFound: true,
                    ruleId: matchedRule.id,
                    ruleName: matchedRule.name,
                    action: matchedRule.action,
                    confidenceScore
                }
            });
        }

        return NextResponse.json({ 
            success: true, 
            data: { matchFound: false, message: 'No rules matched the provided input.' } 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
