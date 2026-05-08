import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ImportExportEngine } from '@/lib/import-export-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const model = req.nextUrl.searchParams.get('model');
    if (!model) return NextResponse.json({ models: ImportExportEngine.getAvailableModels() });
    try {
        const fields = req.nextUrl.searchParams.get('fields')?.split(',');
        const csv = await ImportExportEngine.exportCSV(prisma, model, fields || undefined);
        return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${model}_export.csv"` } });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'detect') {
            const result = ImportExportEngine.parseCSV(body.csv);
            const autoMapping = ImportExportEngine.autoMap(result.columns, body.model);
            return NextResponse.json({ ...result, autoMapping });
        }
        if (body.action === 'validate') {
            const validation = ImportExportEngine.validateMapping(body.model, body.mapping);
            return NextResponse.json(validation);
        }
        if (body.action === 'import') {
            const result = await ImportExportEngine.importBatch(prisma, body.model, body.csv, body.mapping, (user as any).tenantId || '');
            return NextResponse.json(result);
        }
        return NextResponse.json({ error: 'action: detect | validate | import' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
