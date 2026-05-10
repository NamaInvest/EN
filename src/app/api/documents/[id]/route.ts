import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'documents.id' });
async function _DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        // @ts-ignore - VSCode bypass
        const doc = await prisma.documentArchive.findUnique({ where: { id } });

        if (!doc) return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 });

        // @ts-ignore - VSCode bypass
        await prisma.documentArchive.delete({ where: { id } });

        // Try to delete physical file ignoring errors
        try {
            if (doc.fileUrl.startsWith('/uploads/')) {
                const filename = doc.fileUrl.replace('/uploads/', '');
                const filepath = join(process.cwd(), 'public', 'uploads', filename);
                await unlink(filepath);
            }
        } catch (err: any) {
            log.warn('Could not delete physical file for doc archive:', { detail: doc.id, extra: err });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        log.error('Delete document err:', e);
        return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
    }
}

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
