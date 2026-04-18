import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { treasuryCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (from || to) { where.date = {}; if (from) (where.date as Record<string, unknown>).gte = new Date(from); if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59'); }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const entries = await prisma.treasury.findMany({ where, include: { user: { select: { id: true, username: true, fullName: true, role: true, phone: true } } }, orderBy: { date: 'desc' } });
        return NextResponse.json(entries);
    } catch (error) { 
        return handleApiError(error); 
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        
        // Zod Runtime Validation & Strip mass-assignment fields
        const body = treasuryCreateSchema.parse(rawBody);

        const userId = body.userId || null;
        let branchId = body.branchId || null;
        
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        // Transactions inside Treasury purely to align with architecture constraints
        const entry = await prisma.$transaction(async (tx) => {
            return await tx.treasury.create({
                data: { 
                    type: body.type, 
                    amount: body.amount, 
                    description: body.description || null, 
                    referenceType: body.referenceType || 'manual', 
                    referenceId: body.referenceId ? Number(body.referenceId) : null, 
                    userId: userId ? Number(userId) : null, 
                    branchId: branchId ? Number(branchId) : null 
                },
            });
        });
        
        return NextResponse.json(entry, { status: 201 });
    } catch (error) { 
        return handleApiError(error); 
    }
}
