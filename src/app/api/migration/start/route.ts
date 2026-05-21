import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const migrationRun = await prisma.migrationRun.create({
            data: {
                tenantId: body.tenantId || 'test-tenant',
                source: body.source,
                fileName: body.fileName,
                status: 'PENDING',
                dryRun: body.dryRun ?? true,
                stats: { customers: 0, products: 0, invoices: 0 },
                errors: []
            }
        });

        // Normally here we would enqueue a BullMQ job to run scripts/migration/...
        // For demonstration, we just return the pending run

        return NextResponse.json(migrationRun, { status: 201 });
    } catch (error) {
        console.error('Failed to start migration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
