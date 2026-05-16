import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'manufacturing.boms.versions.activate' });

async function _POST(req: NextRequest, { params }: { params: Promise<{ versionId: string }> }, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const versionId = Number((await params).versionId);
        
        // Find the version we want to activate
        const newVersion = await prisma.bOMVersion.findFirst({
            where: { id: versionId, ...requireTenantFilter({ tenantId }) },
            include: { recipe: true }
        });

        if (!newVersion) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        
        const productId = newVersion.recipe.finishedProductId;

        // Find currently active versions for this product
        const activeVersions = await prisma.bOMVersion.findMany({ 
            take: 100,
            where: {
                recipe: { finishedProductId: productId, ...requireTenantFilter({ tenantId }) },
                status: 'ACTIVE',
                ...requireTenantFilter({ tenantId })
            }
        });

        await runFinancialTx(prisma, async (tx) => {
            // Mark them as OBSOLETE
            for (const active of activeVersions) {
                await tx.bOMVersion.update({
                    where: { id: active.id },
                    data: { status: 'OBSOLETE', effectiveTo: new Date() }
                });
            }

            // Activate the new version
            await tx.bOMVersion.update({
                where: { id: versionId },
                data: { status: 'ACTIVE', effectiveFrom: new Date(), effectiveTo: null }
            });
        }, 'BOM_VERSION_ACTIVATE');

        return NextResponse.json({ success: true, message: 'Version activated successfully' });
    } catch (e: any) {
        log.error('manufacturing.boms.activate', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req, auth }, context) => _POST(req as any, context, auth), { rateLimit: 'FINANCIAL' });

