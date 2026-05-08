import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
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
