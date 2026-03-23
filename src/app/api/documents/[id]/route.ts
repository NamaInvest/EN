import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = getUserFromRequest(request);
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
        } catch (err) {
            console.warn('Could not delete physical file for doc archive:', doc.id, err);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Delete document err:', e);
        return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
    }
}
