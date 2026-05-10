import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'manufacturing.boms.versions.versionId.ac' });

async function _POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {

  const { versionId } = await params;
    const prisma = getPrisma(req as any);
    try {
        const versionId = Number((await params).versionId);
        
        // Find the version we want to activate
        const newVersion = await prisma.bOMVersion.findUnique({
            where: { id: versionId },
            include: { recipe: true }
        });

        if (!newVersion) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        
        const productId = newVersion.recipe.finishedProductId;

        // Find currently active versions for this product
        const activeVersions = await prisma.bOMVersion.findMany({
            take: 100,
            where: {
                recipe: { finishedProductId: productId },
                status: 'ACTIVE'
            }
        });

        const updatePromises: any[] = [];

        // Mark them as OBSOLETE
        for (const active of activeVersions) {
            updatePromises.push(
                prisma.bOMVersion.update({
                    where: { id: active.id },
                    data: { status: 'OBSOLETE', effectiveTo: new Date() }
                })
            );
        }

        // Activate the new version
        updatePromises.push(
            prisma.bOMVersion.update({
                where: { id: versionId },
                data: { status: 'ACTIVE', effectiveFrom: new Date(), effectiveTo: null }
            })
        );

        await prisma.$transaction(updatePromises);

        return NextResponse.json({ success: true, message: 'Version activated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
