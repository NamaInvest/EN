import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { register } from '../../../lib/instrumentation/metrics';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'metrics' });

async function _GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': register.contentType },
  });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
