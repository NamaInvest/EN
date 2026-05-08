import { NextRequest, NextResponse } from 'next/server';
import { buildBusinessContext, BusinessContext } from './business-context';

export function withContext<T>(
  handler: (ctx: BusinessContext, req: NextRequest) => Promise<T>,
  options: { requireTenant?: boolean; requirePeriod?: boolean } = {}
) {
  return async (req: NextRequest) => {
    try {
      const ctx = await buildBusinessContext(req);

      if (options.requireTenant && !ctx.tenant) {
        return NextResponse.json({ error: 'Tenant required' }, { status: 401 });
      }

      if (options.requirePeriod && ctx.fiscal?.isClosed) {
        return NextResponse.json({ error: 'Fiscal period closed' }, { status: 423 });
      }

      return await handler(ctx, req);
    } catch (error) {
      console.error('[ContextMiddleware] Build failed:', error);
      return NextResponse.json({ error: 'Context error' }, { status: 500 });
    }
  };
}
