import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'dms' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    if (folderId) {
      const docs = await (prisma as any).dmsDocument.findMany({
            take: 100, where: { folderId: parseInt(folderId) }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json(docs);
    }
    const folders = await (prisma as any).dmsFolder.findMany({
            take: 100, orderBy: { name: 'asc' } });
    return NextResponse.json(folders);
  } catch (error: any) { return apiError(error, 'Error', { context: 'dms' }); }
}


const _POSTSchema = z.object({
  type: z.any().optional(),
  name: z.any().optional(),
  parentId: z.union([z.string(), z.number()]).optional(),
  tenantId: z.union([z.string(), z.number()]).optional(),
  path: z.any().optional(),
  mimeType: z.any().optional(),
  size: z.any().optional(),
  folderId: z.union([z.string(), z.number()]).optional(),
  tags: z.array(z.any()).optional(),
  uploadedBy: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    if (data.type === 'folder') {
      const folder = await (prisma as any).dmsFolder.create({ data: { name: data.name, parentId: data.parentId ? parseInt(data.parentId) : null, tenantId: data.tenantId || 'default' } });
      return NextResponse.json(folder);
    }
    const doc = await (prisma as any).dmsDocument.create({
      data: { name: data.name, path: data.path || '', mimeType: data.mimeType || 'application/octet-stream', size: parseInt(data.size) || 0, folderId: data.folderId ? parseInt(data.folderId) : null, tags: data.tags || null, uploadedBy: parseInt(data.uploadedBy) || 0, tenantId: data.tenantId || 'default' }
    });
    return NextResponse.json(doc);
  } catch (error: any) { return apiError(error, 'Error', { context: 'dms' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
