import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const documentType = formData.get('documentType') as string;
        const documentId = parseInt(formData.get('documentId') as string);
        const docName = formData.get('docName') as string || file?.name || 'مستند';
        const expiryDateStr = formData.get('expiryDate') as string | null;

        if (!file || !documentType || !documentId) {
            return NextResponse.json({ error: 'الملف، نوع المستند ومعرف المستند مطلوبين' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload path standard
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);
        const fileUrl = `/uploads/${filename}`;

        // Create Database Record
        // @ts-ignore - Local VSCode bypass
        const record = await prisma.documentArchive.create({
            data: {
                documentType,
                documentId,
                docName,
                fileUrl,
                expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
                createdBy: auth.userId
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (e) {
        console.error('File upload error:', e);
        return NextResponse.json({ error: 'فشل في رفع الملف' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const documentType = searchParams.get('documentType');
        const documentId = searchParams.get('documentId');

        if (!documentType || !documentId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // @ts-ignore - Local VSCode bypass
        const docs = await prisma.documentArchive.findMany({
            take: 100,
            where: {
                documentType,
                documentId: parseInt(documentId)
            },
            orderBy: { id: 'desc' },
            include: { creator: { select: { fullName: true } } }
        });

        return NextResponse.json(docs);
    } catch (e) {
        console.error('Fetch docs error:', e);
        return NextResponse.json({ error: 'فشل جلب المستندات' }, { status: 500 });
    }
}
