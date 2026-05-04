import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const statements = await prisma.bankStatement.findMany({
            orderBy: { importedAt: 'desc' },
            include: { bankAccount: true },
            take: 50
        });

        return NextResponse.json(statements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
