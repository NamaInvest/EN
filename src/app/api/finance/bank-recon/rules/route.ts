import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const rules = await prisma.bankReconRule.findMany({
            take: 100,
            orderBy: { priority: 'asc' },
            include: { bankAccount: true }
        });

        const bankAccounts = await prisma.bankAccount.findMany({
            take: 100,
            where: { isActive: true },
            select: { id: true, bankName: true, accountNumber: true, currency: true }
        });

        // Basic stats
        const stats = {
            totalRules: rules.length,
            activeRules: rules.filter((r: any) => r.enabled).length,
            successfulMatches: rules.reduce((acc: number, r: any) => acc + r.successCount, 0)
        };

        return NextResponse.json({ success: true, data: { rules, bankAccounts, stats } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  bankAccountId: z.union([z.string(), z.number()]).optional(),
  conditions: z.any().optional(),
  action: z.any().optional(),
  actionParams: z.any().optional(),
  priority: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const { name, bankAccountId, conditions, action, actionParams, priority } = body;

        const newRule = await prisma.bankReconRule.create({
            data: {
                name,
                bankAccountId: bankAccountId ? Number(bankAccountId) : null,
                conditions: conditions || [],
                action,
                actionParams: actionParams || {},
                priority: Number(priority) || 100,
                enabled: true
            }
        });

        return NextResponse.json({ success: true, data: newRule });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  enabled: z.boolean().optional(),
}).passthrough();

async function _PUT(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { id, enabled } = body;

        const updated = await prisma.bankReconRule.update({
            where: { id: Number(id) },
            data: { enabled }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _DELETE(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await prisma.bankReconRule.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
