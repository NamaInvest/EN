import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { DMSEngine } from '@/lib/dms-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const folderId = req.nextUrl.searchParams.get('folderId');
        const search = req.nextUrl.searchParams.get('search');
        const linkedModel = req.nextUrl.searchParams.get('linkedModel');
        const linkedId = req.nextUrl.searchParams.get('linkedId');
        if (search) return NextResponse.json(await DMSEngine.search(prisma, search));
        if (linkedModel && linkedId) return NextResponse.json(await DMSEngine.getLinked(prisma, linkedModel, parseInt(linkedId)));
        return NextResponse.json(await DMSEngine.listFolder(prisma, folderId ? parseInt(folderId) : undefined));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'upload') return NextResponse.json(await DMSEngine.upload(prisma, { ...body, uploadedBy: (user as any).id, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'create_folder') return NextResponse.json(await DMSEngine.createFolder(prisma, body.name, body.parentId, (user as any).tenantId || ''));
        if (body.action === 'new_version') return NextResponse.json(await DMSEngine.newVersion(prisma, body.documentId, body.newPath, body.newSize));
        return NextResponse.json({ error: 'action: upload | create_folder | new_version' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
