import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { handleApiError } from '@/lib/api-handler';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items-api' });

async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        // Enforce Multi-tenant isolation context
        const tenantId = requireTenantId(request as any);
        
        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId') || searchParams.get('customerId');
        
        if (!partnerId) {
            return NextResponse.json(
                { error: 'customerId or partnerId query parameter is strictly required.' },
                { status: 400 }
            );
        }
        
        const customerId = parseInt(partnerId);
        if (isNaN(customerId)) {
            return NextResponse.json(
                { error: 'Invalid customerId/partnerId parameter format.' },
                { status: 400 }
            );
        }

        // Call the read-only service query engine
        const data = await OpenItemsService.getOpenItems(prisma, tenantId, customerId);
        
        return NextResponse.json(data);
    } catch (error: any) {
        log.error('src/app/api/open-items/route.ts GET error', { 
            errorMessage: error instanceof Error ? error.message : String(error) 
        });
        return handleApiError(error);
    }
}

// Expose strictly read-only GET endpoint protected by system RBAC options
export const GET = withRoute(async ({ req }) => _GET(req as any), { 
    rateLimit: 'DEFAULT', 
    module: 'accounting', 
    permission: 'view' 
});
