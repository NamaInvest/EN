import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const permissions = await prisma.roleFieldPermission.findMany({
            take: 100,
            orderBy: [{ roleName: 'asc' }, { modelName: 'asc' }, { fieldName: 'asc' }]
        });
        return NextResponse.json(permissions);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { roleName, modelName, fieldName, permission } = body;

        if (!roleName || !modelName || !fieldName || !permission) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const upserted = await prisma.roleFieldPermission.upsert({
            where: {
                roleName_modelName_fieldName: {
                    roleName,
                    modelName,
                    fieldName
                }
            },
            update: { permission },
            create: { roleName, modelName, fieldName, permission }
        });

        return NextResponse.json(upserted);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
