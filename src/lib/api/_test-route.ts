// Quick test file
import { withRoute } from './with-route';

// Test: withRoute with options
export const GET = withRoute(async (ctx) => {
  return new Response('ok');
}, { rateLimit: 'FINANCIAL' });

export const POST = withRoute(async (ctx) => {
  return new Response('ok');
}, { requireAuth: false });
