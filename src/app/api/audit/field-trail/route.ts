import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');
    const recordId = searchParams.get('recordId');
    const where: any = {};
    if (tableName) where.tableName = tableName;
    if (recordId) where.recordId = parseInt(recordId);
    const logs = await (prisma as any).fieldAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json(logs);
  } catch (error: any) { return apiError(error, 'Error', { context: 'audit/field-trail' }); }
}
