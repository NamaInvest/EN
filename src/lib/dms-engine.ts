/**
 * Document Management Engine (G-11)
 * ══════════════════════════════════
 * File upload, folders, versioning, tagging, model linking
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.dms-engine.t' });
const p = (prisma: PrismaClient) => prisma as any;

export class DMSEngine {
    /** Upload document */
    static async upload(prisma: PrismaClient, data: {
        name: string; path: string; mimeType: string; size: number;
        folderId?: number; linkedModel?: string; linkedId?: number;
        tags?: string; uploadedBy: number; tenantId: string;
    }) {
        return p(prisma).dmsDocument.create({
            data: { ...data, version: 1, createdAt: new Date() },
        });
    }

    /** Create folder */
    static async createFolder(prisma: PrismaClient, name: string, parentId?: number, tenantId?: string) {
        return p(prisma).dmsFolder.create({ data: { name, parentId, tenantId: tenantId || '' } });
    }

    /** List folder contents */
    static async listFolder(prisma: PrismaClient, folderId?: number) {
        const folders = await p(prisma).dmsFolder.findMany({
            take: 100,
            where: { parentId: folderId || null },
            orderBy: { name: 'asc' },
        });
        const documents = await p(prisma).dmsDocument.findMany({
            take: 100,
            where: { folderId: folderId || null },
            orderBy: { createdAt: 'desc' },
        });
        return { folders, documents };
    }

    /** Search documents */
    static async search(prisma: PrismaClient, query: string) {
        return p(prisma).dmsDocument.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { tags: { contains: query } },
                ],
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Get documents linked to a record */
    static async getLinked(prisma: PrismaClient, linkedModel: string, linkedId: number) {
        return p(prisma).dmsDocument.findMany({
            take: 100,
            where: { linkedModel, linkedId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Upload new version */
    static async newVersion(prisma: PrismaClient, documentId: number, newPath: string, newSize: number) {
        const doc = await p(prisma).dmsDocument.findUnique({ where: { id: documentId } });
        if (!doc) throw new Error('المستند غير موجود');
        return p(prisma).dmsDocument.update({
            where: { id: documentId },
            data: { path: newPath, size: newSize, version: doc.version + 1 },
        });
    }
}
