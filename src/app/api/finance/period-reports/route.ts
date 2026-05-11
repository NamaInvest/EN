import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { FXRevaluationEngine } from '@/lib/fx-revaluation-engine';
import { GRIRClearingEngine } from '@/lib/gr-ir-clearing-engine';

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const report    = searchParams.get('report');
  const asOf      = searchParams.get('asOf');
  const post      = searchParams.get('post') === 'true';

  if (report === 'fx-reval') {
    const result = await FXRevaluationEngine.run(
      tenantId,
      asOf ? new Date(asOf) : new Date(),
      post,
    );
    return NextResponse.json(result);
  }

  if (report === 'grir') {
    const result = await GRIRClearingEngine.generateReport(
      tenantId,
      asOf ? new Date(asOf) : undefined,
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({
    error: 'report يجب أن يكون: fx-reval | grir',
    examples: [
      '/api/finance/period-reports?report=fx-reval&tenantId=x&asOf=2026-03-31',
      '/api/finance/period-reports?report=grir&tenantId=x&asOf=2026-03-31',
    ],
  }, { status: 400 });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
