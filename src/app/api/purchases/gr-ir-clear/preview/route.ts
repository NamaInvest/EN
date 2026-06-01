/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { GRIRClearingEngine } from '@/lib/gr-ir-clearing-engine';
import { handleApiError } from '@/lib/api-handler';
import { logger } from '@/lib/observability/logger';

const log = logger.child({ route: 'gr-ir-clear-preview' });

async function _GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request as any);
    
    // Parse query params (optional date)
    const { searchParams } = new URL(request.url);
    const asOfStr = searchParams.get('asOf');
    const asOfDate = asOfStr ? new Date(asOfStr) : undefined;

    log.info('Generating GR/IR Clearing Preview Report via API', { tenantId, asOfStr });
    
    const report = await GRIRClearingEngine.generateReport(tenantId, asOfDate);
    
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    log.error('Error generating GR/IR Clearing Preview', { error: error?.message });
    return handleApiError(error);
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
