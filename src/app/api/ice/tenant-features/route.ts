import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantAccountId = searchParams.get('tenantAccountId');
        if (!tenantAccountId) return NextResponse.json({ error: 'Missing tenantAccountId' }, { status: 400 });

        const flags = await prisma.tenantFeatureFlag.findMany({
            take: 100,
            where: { tenantAccountId: Number(tenantAccountId) }
        });
        
        return NextResponse.json({ success: true, flags });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { tenantAccountId, moduleName, isEnabled } = await req.json();
        
        if (!tenantAccountId || !moduleName) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const flag = await prisma.tenantFeatureFlag.upsert({
            where: {
                unique_tenant_module: {
                    tenantAccountId: Number(tenantAccountId),
                    moduleName: moduleName
                }
            },
            update: { isEnabled },
            create: {
                tenantAccountId: Number(tenantAccountId),
                moduleName,
                isEnabled
            }
        });

        return NextResponse.json({ success: true, flag });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
