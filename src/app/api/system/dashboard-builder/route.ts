import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { DashboardBuilderEngine } from '@/lib/dashboard-builder-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const view = req.nextUrl.searchParams.get('view');
    if (view === 'sources') return NextResponse.json({ sources: DashboardBuilderEngine.getDataSources() });
    if (view === 'defaults') return NextResponse.json({ widgets: DashboardBuilderEngine.getDefaultWidgets() });
    return NextResponse.json({ sources: DashboardBuilderEngine.getDataSources(), defaults: DashboardBuilderEngine.getDefaultWidgets() });
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
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
