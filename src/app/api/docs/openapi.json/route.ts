import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getOpenAPISpec } from '@/lib/openapi';

/**
 * GET /api/docs/openapi.json
 * Returns the OpenAPI 3.1 specification for NamaInvest ERP.
 * This endpoint is public (no auth required).
 */
async function _GET() {
  return NextResponse.json(getOpenAPISpec(), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
