import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const { id } = await params;
    const prisma = getPrisma(request);
    try {
        const asset = await prisma.fixedAsset.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
        return NextResponse.json(asset);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'فشل جلب الأصل', { context: 'fixed-assets/[id]' });
    }
}

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const { id } = await params;
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const data: Record<string, unknown> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.nameAr !== undefined) data.nameAr = body.nameAr;
        if (body.salvageValue !== undefined) data.salvageValue = parseFloat(body.salvageValue);
        if (body.usefulLifeYears !== undefined) data.usefulLifeYears = parseInt(body.usefulLifeYears);
        if (body.depreciationMethod !== undefined) data.depreciationMethod = body.depreciationMethod;
        if (body.locationId !== undefined) data.locationId = body.locationId;
        if (body.status !== undefined) data.status = body.status;

        const asset = await prisma.fixedAsset.update({
            where: { id: parseInt(id, 10) },
            data,
        });
        return NextResponse.json(asset);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets/[id]' });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const { id } = await params;
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const asset = await prisma.fixedAsset.findUnique({ where: { id: parseInt(id, 10) } });
        if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
        if (asset.accumulatedDepreciation && Number(asset.accumulatedDepreciation) > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف أصل بدأ إهلاكه — استخدم Disposal' }, { status: 400 });
        }
        await prisma.fixedAsset.delete({ where: { id: parseInt(id, 10) } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'fixed-assets/[id]' });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
