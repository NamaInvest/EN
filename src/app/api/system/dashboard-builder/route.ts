import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { DashboardBuilderEngine } from '@/lib/dashboard-builder-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const view = req.nextUrl.searchParams.get('view');
    if (view === 'sources') return NextResponse.json({ sources: DashboardBuilderEngine.getDataSources() });
    if (view === 'defaults') return NextResponse.json({ widgets: DashboardBuilderEngine.getDefaultWidgets() });
    return NextResponse.json({ sources: DashboardBuilderEngine.getDataSources(), defaults: DashboardBuilderEngine.getDefaultWidgets() });
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  widget: z.any().optional(),
  widgets: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'widget_data') {
            const data = await DashboardBuilderEngine.getWidgetData(prisma, body.widget);
            return NextResponse.json(data);
        }
        if (body.action === 'all_widgets') {
            const widgets = body.widgets || DashboardBuilderEngine.getDefaultWidgets();
            const results: Record<string, any> = {};
            for (const w of widgets) {
                results[w.id] = await DashboardBuilderEngine.getWidgetData(prisma, w);
            }
            return NextResponse.json(results);
        }
        return NextResponse.json({ error: 'action: widget_data | all_widgets' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
